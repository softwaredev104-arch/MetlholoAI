"""Install the pinned *candidate* public ONNX crop model; no silent enablement.

The source model card declares MIT for model weights, but training dataset and
architecture license obligations require operator review before enablement.
Downloaded weights stay in the model volume and are not committed to Git.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"

CANDIDATE = {
    "id": "community-crop-five-class-v1",
    "display_name": "Community crop leaf research model",
    "category": "crops",
    "subject": "Maize, cassava and beans",
    "provider": "onnx",
    "weights_path": "models/community-crop-five-class-v1.onnx",
    "labels_path": "models/community-crop-five-class-v1.labels.json",
    "weights_sha256": "f193ad03d26b0075edf796e753e92a20a93d9732ee1253f00a9cc9cd2f5279dc",
    "source": "https://huggingface.co/Gopina/maize-disease-classifier",
    "weights_url": "https://huggingface.co/Gopina/maize-disease-classifier/resolve/main/model.onnx",
    "license": "MIT (model card declaration); dataset terms require independent review",
    "license_verified": False,
    "validated_for_botswana": False,
    "input_size": 224,
    "input_layout": "NHWC",
    "normalization": "none",
    "output_type": "probabilities",
    "labels": ["healthy", "maize_rust", "maize_blight", "cassava_mosaic", "bean_spot"],
    "threshold": 0.75,
}

def install(acknowledge_licensing: bool = False) -> Path:
    MODELS.mkdir(parents=True, exist_ok=True)
    destination = ROOT / CANDIDATE["weights_path"]
    temporary = destination.with_suffix(".part")
    digest = hashlib.sha256()
    bytes_seen = 0
    try:
        request = Request(CANDIDATE["weights_url"], headers={"User-Agent": "MetlholoAI-model-installer/0.1"})
        with urlopen(request, timeout=90) as response, temporary.open("wb") as output:
            while True:
                chunk = response.read(256 * 1024)
                if not chunk:
                    break
                bytes_seen += len(chunk)
                if bytes_seen > 12 * 1024 * 1024:
                    raise ValueError("Model exceeds the 12 MB download limit")
                digest.update(chunk)
                output.write(chunk)
        if digest.hexdigest() != CANDIDATE["weights_sha256"]:
            raise ValueError("Pinned model checksum mismatch; model was not installed")
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)

    (ROOT / CANDIDATE["labels_path"]).write_text(
        json.dumps(CANDIDATE["labels"], indent=2) + "\n", encoding="utf-8"
    )
    manifest = {key: value for key, value in CANDIDATE.items()
                if key not in ("weights_url", "labels")}
    manifest["license_verified"] = bool(acknowledge_licensing)
    registry = ROOT / "registry.approved.json"
    existing = {"models": []}
    if registry.exists():
        existing = json.loads(registry.read_text(encoding="utf-8"))
    current = [m for m in existing.get("models", []) if m.get("id") != manifest["id"]]
    current.append(manifest)
    registry.write_text(json.dumps({"models": current}, indent=2) + "\n", encoding="utf-8")
    print(f"Verified bytes={bytes_seen}, sha256={digest.hexdigest()}")
    print(f"Model manifest: {registry}")
    if not acknowledge_licensing:
        print(
            "NOT ENABLED. Review dataset rights, model license and permitted use, then "
            "rerun with --acknowledge-licensing after formal approval."
        )
    else:
        print(
            "Operator acknowledged licensing. Model can run as an unvalidated "
            "research suggestion; it is NOT a confirmed diagnostic for Botswana."
        )
    print("To use: METLHOLO_MODEL_REGISTRY_PATH=registry.approved.json")
    return registry

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--acknowledge-licensing", action="store_true",
        help="Explicit operator acknowledgement that model/dataset/architecture licenses were reviewed",
    )
    args = parser.parse_args()
    install(args.acknowledge_licensing)
