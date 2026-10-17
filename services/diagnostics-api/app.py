"""MetlholoAI inference gateway: user-authenticated, licensed, evidence-first.

Real ONNX weights and Roboflow model identifiers must be installed/configured by
operators. Empty registry means zero available models, never synthetic results.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import re
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
CATEGORIES = {"crops", "fruits", "pests", "livestock"}
MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = int(os.getenv("METLHOLO_MAX_IMAGE_BYTES", "8388608"))
MIN_CONFIDENCE = 0.60

app = FastAPI(title="MetlholoAI Diagnostics", version="0.1.0")
origins = [
    origin.strip()
    for origin in os.getenv("METLHOLO_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"], allow_credentials=False,
)


def _model_registry() -> list[dict[str, Any]]:
    configured_path = os.getenv("METLHOLO_MODEL_REGISTRY_PATH", "registry.json")
    path = Path(configured_path)
    if not path.is_absolute():
        path = ROOT / path
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise HTTPException(503, "Diagnostic model registry is unavailable") from exc
    models = data.get("models")
    if not isinstance(models, list) or not all(isinstance(m, dict) for m in models):
        raise HTTPException(503, "Invalid diagnostic registry")
    ids = [m.get("id") for m in models]
    if len(ids) != len(set(ids)):
        raise HTTPException(503, "Duplicate model identifiers")
    return models


def _local_file(relative: str) -> Path:
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT):
        raise HTTPException(503, "Configured model path escapes the service")
    return path


def _is_ready(m: dict[str, Any]) -> bool:
    if m.get("category") not in CATEGORIES or not m.get("license_verified"):
        return False
    if not all(isinstance(m.get(k), str) and m[k].strip() for k in
               ("id", "display_name", "category", "subject", "provider", "license")):
        return False
    if m["provider"] == "onnx":
        paths = (m.get("weights_path"), m.get("labels_path"))
        if not all(isinstance(v, str) and v for v in paths):
            return False
        try:
            weights = _local_file(paths[0])
            labels = _local_file(paths[1])
            return (weights.is_file() and labels.is_file() and
                    bool(re.fullmatch(r"[0-9a-fA-F]{64}", str(m.get("weights_sha256", "")))))
        except HTTPException:
            return False
    if m["provider"] == "roboflow":
        # Operated via a separately deployed, secured Roboflow Inference engine.
        return bool(re.fullmatch(r"[\w-]+/\d+", str(m.get("model_id", "")))) and bool(
            os.getenv("METLHOLO_ROBOFLOW_INFERENCE_URL", "").strip()
        )
    return False


def _selected_model(model_id: str) -> dict[str, Any]:
    item = next((m for m in _model_registry() if m.get("id") == model_id), None)
    if not item:
        raise HTTPException(404, "Unknown diagnostic model")
    if not _is_ready(item):
        raise HTTPException(503, "Model is not installed, licensed, or configured")
    return item


def verify_firebase(authorization: str | None = Header(default=None)) -> str:
    if (os.getenv("METLHOLO_ENV") == "development" and
            os.getenv("METLHOLO_DEV_NO_AUTH") == "true"):
        return "local-development-only"
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Firebase sign-in required")
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        decoded = firebase_auth.verify_id_token(
            authorization[7:], check_revoked=True
        )
        return decoded["uid"]
    except Exception as exc:
        raise HTTPException(401, "Invalid or expired Firebase identity") from exc


@app.get("/health")
def health():
    return {"status": "ok", "models_ready": sum(_is_ready(m) for m in _model_registry())}


@app.get("/v1/models")
def models(uid: str = Depends(verify_firebase)):
    return {
        "models": [
            {
                "id": m.get("id"), "name": m.get("display_name"),
                "category": m.get("category"), "subject": m.get("subject"),
                "provider": m.get("provider"),
                "ready": _is_ready(m),
                "validated_for_botswana": m.get("validated_for_botswana") is True,
                "review_required": True,
            } for m in _model_registry()
        ]
    }


def _read_image(data: bytes, claimed_type: str | None) -> Image.Image:
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is empty or exceeds upload size limit")
    if claimed_type not in MIME_TYPES:
        raise HTTPException(415, "Upload JPEG, PNG or WebP")
    try:
        image = Image.open(io.BytesIO(data))
        image.verify()
        image = Image.open(io.BytesIO(data))
        if image.format not in ("JPEG", "PNG", "WEBP"):
            raise ValueError("Unsupported image encoding")
        if image.width * image.height > 25_000_000:
            raise HTTPException(413, "Image dimensions are too large")
        return ImageOps.exif_transpose(image).convert("RGB")
    except (ValueError, UnidentifiedImageError, OSError) as exc:
        raise HTTPException(415, "Invalid image file") from exc


@lru_cache(maxsize=8)
def _onnx_session(path: str):
    import onnxruntime as ort
    return ort.InferenceSession(path, providers=["CPUExecutionProvider"])


def _onnx_predictions(model: dict[str, Any], image: Image.Image) -> list[dict]:
    import numpy as np
    weights = _local_file(model["weights_path"])
    labels_path = _local_file(model["labels_path"])
    checksum = hashlib.sha256(weights.read_bytes()).hexdigest()
    if checksum.lower() != model["weights_sha256"].lower():
        raise HTTPException(503, "Model weights failed integrity check")

    labels = json.loads(labels_path.read_text(encoding="utf-8"))
    if not isinstance(labels, list) or not all(isinstance(v, str) for v in labels):
        raise HTTPException(503, "Invalid model label file")
    input_size = int(model.get("input_size", 224))
    if input_size < 32 or input_size > 1024:
        raise HTTPException(503, "Invalid model input size")
    pixels = np.asarray(image.resize((input_size, input_size)), dtype=np.float32) / 255.0
    if model.get("normalization", "imagenet") == "imagenet":
        pixels = (pixels - np.asarray([0.485, 0.456, 0.406], np.float32)) / np.asarray(
            [0.229, 0.224, 0.225], np.float32
        )
    elif model.get("normalization") != "none":
        raise HTTPException(503, "Unsupported model normalization")
    layout = model.get("input_layout", "NCHW")
    if layout == "NCHW":
        array = np.transpose(pixels, (2, 0, 1))[None, :, :, :]
    elif layout == "NHWC":
        array = pixels[None, :, :, :]
    else:
        raise HTTPException(503, "Unsupported ONNX input layout")
    session = _onnx_session(str(weights))
    scores = np.asarray(session.run(None, {session.get_inputs()[0].name: array})[0]).flatten()
    if scores.size != len(labels) or not np.all(np.isfinite(scores)):
        raise HTTPException(503, "Model output does not match its class labels")
    if model.get("output_type", "logits") == "logits":
        shifted = scores - np.max(scores)
        exp = np.exp(shifted)
        scores = exp / np.sum(exp)
    elif model.get("output_type") == "probabilities":
        if np.any(scores < 0) or scores.sum() <= 0:
            raise HTTPException(503, "Model returned invalid probabilities")
        scores = scores / scores.sum()
    else:
        raise HTTPException(503, "Unsupported model output type")
    order = np.argsort(scores)[::-1][:5]
    return [{"label": labels[int(i)], "confidence": float(scores[i])} for i in order]


def _roboflow_predictions(model: dict[str, Any], image: Image.Image) -> list[dict]:
    # Inference SDK handles detection and classification schemas. The model
    # provider may require its own API key even on a self-hosted installation.
    from inference_sdk import InferenceHTTPClient
    kwargs: dict[str, str] = {
        "api_url": os.environ["METLHOLO_ROBOFLOW_INFERENCE_URL"].rstrip("/")
    }
    if os.getenv("ROBOFLOW_API_KEY"):
        kwargs["api_key"] = os.environ["ROBOFLOW_API_KEY"]
    client = InferenceHTTPClient(**kwargs)
    with tempfile.NamedTemporaryFile(suffix=".jpg") as file:
        image.save(file.name, "JPEG", quality=92)
        response = client.infer(file.name, model_id=model["model_id"])
    if not isinstance(response, dict):
        raise ValueError("Unexpected provider response")
    predictions = response.get("predictions", [])
    if isinstance(predictions, dict):
        predictions = [{"class": k, "confidence": v.get("confidence", 0)}
                       for k, v in predictions.items() if isinstance(v, dict)]
    if not isinstance(predictions, list):
        raise ValueError("Unexpected prediction shape")
    ranked: dict[str, float] = {}
    for item in predictions:
        if not isinstance(item, dict):
            continue
        label = item.get("class") or item.get("class_name") or item.get("label")
        if not isinstance(label, str) or not label.strip():
            continue
        value = float(item.get("confidence", 0))
        if value > 1:
            value /= 100
        if 0 <= value <= 1:
            ranked[label] = max(ranked.get(label, 0), value)
    return [{"label": k, "confidence": v}
            for k, v in sorted(ranked.items(), key=lambda p: -p[1])[:5]]


@app.post("/v1/predict")
def predict(
    model_id: str = Form(...),
    image: UploadFile = File(...),
    uid: str = Depends(verify_firebase),
):
    model = _selected_model(model_id)
    raw = image.file.read(MAX_BYTES + 1)
    picture = _read_image(raw, image.content_type)
    try:
        predictions = (_onnx_predictions(model, picture) if model["provider"] == "onnx"
                       else _roboflow_predictions(model, picture))
    except HTTPException:
        raise
    except Exception as exc:
        # Never return provider keys or internal network URLs in client errors.
        raise HTTPException(502, "Diagnostic model failed. Please try again later.") from exc

    top = predictions[0] if predictions else None
    confident = bool(top and top["confidence"] >= float(model.get("threshold", MIN_CONFIDENCE)))
    return {
        "success": True,
        "prediction": top["label"] if confident else "Uncertain",
        "disease": top["label"] if confident else "Uncertain",
        "confidence": top["confidence"] if top else 0.0,
        "candidates": predictions,
        "uncertain": not confident,
        "modelId": model["id"],
        "modelVersion": model.get("version", "unversioned"),
        "provider": model["provider"],
        "validatedForBotswana": model.get("validated_for_botswana") is True,
        "reviewRequired": True,
        "status": "ai_suggestion_not_confirmed",
    }


class ReportRequest(BaseModel):
    modelId: str
    disease: str = Field(min_length=1, max_length=150)
    confidence: float = Field(ge=0, le=1)
    country: str = Field(default="Botswana", max_length=80)
    district: str | None = Field(default=None, max_length=120)
    cropOrAnimal: str = Field(min_length=1, max_length=120)


@app.post("/v1/report")
def report(input: ReportRequest, uid: str = Depends(verify_firebase)):
    model = _selected_model(input.modelId)
    # This is an explicitly limited factual summary, not fabricated treatment
    # instructions or an LLM-veterinarian. Real evidence-backed guidance comes
    # from the existing verified knowledge-reference layer.
    return {
        "structuredReport": {
            "assessment": (
                f"Unconfirmed AI-suggested finding: {input.disease}"
                if input.disease.lower() != "uncertain"
                else "The image did not support a reliable classification."
            ),
            "subject": input.cropOrAnimal,
            "location": ", ".join(filter(None, [input.district, input.country])),
            "confidence": input.confidence,
            "modelId": model["id"],
            "modelVersion": model.get("version", "unversioned"),
            "validation": (
                "Local validation documented"
                if model.get("validated_for_botswana") else
                "Not independently validated on Botswana field images"
            ),
            "nextSteps": (
                "Record symptoms, additional images and time of onset; seek "
                "a qualified agricultural or veterinary professional for "
                "diagnosis, treatment decisions and official disease reporting."
            ),
            "outbreakStatus": "Not verified; no public alert issued",
        }
    }
