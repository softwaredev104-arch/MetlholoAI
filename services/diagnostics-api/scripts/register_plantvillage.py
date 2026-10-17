"""Validate a locally trained PlantVillage ONNX model before registration.

No synthetic predictions; license confirmation requires an explicit opt-in.
Installing on disk does not by itself deploy a remote inference service.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "models"
REGISTRY = ROOT / "registry.approved.json"


def inside_model_dir(relative: str) -> Path:
    if not relative.startswith("models/"):
        raise ValueError("Only models/ files can be registered")
    value = (ROOT / relative).resolve()
    if not value.is_relative_to(MODELS.resolve()):
        raise ValueError("Model path escapes the model storage directory")
    return value


def register(manifest_path: Path, acknowledge_licensing: bool = False) -> dict:
    manifest_path = manifest_path.resolve()
    if not manifest_path.is_relative_to(MODELS.resolve()):
        raise ValueError("Manifest must be inside the models directory")
    metadata = json.loads(manifest_path.read_text(encoding="utf-8"))
    if metadata.get("provider") != "onnx":
        raise ValueError("Only exported ONNX classifiers are supported")
    if metadata.get("training_source") != "https://github.com/spMohanty/PlantVillage-Dataset":
        raise ValueError("This installer only supports audited PlantVillage training manifests")
    if not re.fullmatch(r"[a-f0-9]{40}", str(metadata.get("dataset_revision", ""))):
        raise ValueError("The dataset revision is not pinned")
    if metadata.get("validated_for_botswana") is not False:
        raise ValueError("Do not claim Botswana field validation without evidence")
    labels_path = inside_model_dir(metadata.get("labels_path", ""))
    weights_path = inside_model_dir(metadata.get("weights_path", ""))
    labels = json.loads(labels_path.read_text(encoding="utf-8"))
    if not isinstance(labels, list) or len(labels) < 2 or (
        not all(isinstance(x, str) and x.strip() for x in labels)
    ) or len(labels) != len(set(labels)):
        raise ValueError("ONNX labels are invalid")
    if metadata.get("class_count") != len(labels):
        raise ValueError("Model class count and label file mismatch")
    if not re.fullmatch(r"[a-f0-9]{64}", str(metadata.get("weights_sha256", ""))):
        raise ValueError("Missing pinned ONNX checksum")
    digest = hashlib.sha256(weights_path.read_bytes()).hexdigest()
    if digest != metadata["weights_sha256"]:
        raise ValueError("ONNX weight checksum mismatch; registration denied")
    metrics = metadata.get("evaluation", {})
    if not isinstance(metrics, dict) or (
        not isinstance(metrics.get("test_accuracy"), (int, float))
    ) or metrics.get("test_examples", 0) < 1:
        raise ValueError("No genuine held-out model evaluation")
    if metrics["test_accuracy"] < 0.65 or metrics["test_accuracy"] > 1:
        raise ValueError("Research model fails the minimum held-out performance gate")

    # No training references become public until verified and licensed. Existing
    # classes for other models are preserved, never overwritten wholesale.
    metadata["capture_examples"] = []
    metadata["validated_for_botswana"] = False
    metadata["license_verified"] = bool(acknowledge_licensing)
    existing = {"models": []}
    if REGISTRY.exists():
        existing = json.loads(REGISTRY.read_text(encoding="utf-8"))
    if not isinstance(existing.get("models"), list):
        raise ValueError("Invalid existing model registry")
    result = [
        item for item in existing["models"]
        if isinstance(item, dict) and item.get("id") != metadata["id"]
    ] + [metadata]
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    temporary = REGISTRY.with_suffix(".tmp")
    try:
        temporary.write_text(json.dumps({"models": result}, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary, REGISTRY)
    finally:
        temporary.unlink(missing_ok=True)
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="models/<model-id>.manifest.json")
    parser.add_argument("--acknowledge-licensing", action="store_true",
                        help="Operator certifies dataset/model use and attribution obligations reviewed")
    args = parser.parse_args()
    model = register(args.manifest, args.acknowledge_licensing)
    print("Registered:", model["id"])
    print("License approved:", model["license_verified"])
    print("Botswana field validation: NOT claimed")
    print("Set METLHOLO_MODEL_REGISTRY_PATH=registry.approved.json on the Python host")
