import hashlib
import json
import pytest
from scripts import register_plantvillage as reg


def fixture(monkeypatch, tmp_path):
    monkeypatch.setattr(reg, "ROOT", tmp_path)
    monkeypatch.setattr(reg, "MODELS", tmp_path / "models")
    monkeypatch.setattr(reg, "REGISTRY", tmp_path / "registry.approved.json")
    (tmp_path / "models").mkdir()
    weights = b"test-trained-bytes"
    (tmp_path / "models/m.onnx").write_bytes(weights)
    (tmp_path / "models/m.labels.json").write_text('["maize_healthy","maize_rust"]')
    meta = {
        "id": "plantvillage-maize-v1",
        "provider": "onnx",
        "weights_path": "models/m.onnx",
        "weights_sha256": hashlib.sha256(weights).hexdigest(),
        "labels_path": "models/m.labels.json",
        "class_count": 2,
        "training_source": reg.ROOT.as_uri() if False else
            "https://github.com/spMohanty/PlantVillage-Dataset",
        "dataset_revision": "a" * 40,
        "evaluation": {"test_accuracy": 0.85, "test_examples": 10},
        "validated_for_botswana": False,
        "license_verified": False,
        "capture_examples": [{"uri": "https://incorrect-claim/"}],
    }
    path = tmp_path / "models/m.manifest.json"
    path.write_text(json.dumps(meta))
    return path, meta


def test_gated_local_registration(monkeypatch, tmp_path):
    path, meta = fixture(monkeypatch, tmp_path)
    result = reg.register(path)
    assert result["license_verified"] is False
    assert result["capture_examples"] == []
    approved = reg.register(path, acknowledge_licensing=True)
    assert approved["license_verified"] is True
    assert approved["validated_for_botswana"] is False
    assert json.loads(reg.REGISTRY.read_text())["models"] == [approved]


def test_rejects_tampered_weights_and_unverified_labels(monkeypatch, tmp_path):
    path, meta = fixture(monkeypatch, tmp_path)
    (tmp_path / "models/m.onnx").write_bytes(b"tampered")
    with pytest.raises(ValueError, match="checksum mismatch"):
        reg.register(path, acknowledge_licensing=True)
    assert not reg.REGISTRY.exists()
    (tmp_path / "models/m.onnx").write_bytes(b"test-trained-bytes")
    (tmp_path / "models/m.labels.json").write_text('["one","two","three"]')
    with pytest.raises(ValueError, match="class count"):
        reg.register(path, acknowledge_licensing=True)


def test_does_not_register_inaccurate_model(monkeypatch, tmp_path):
    path, meta = fixture(monkeypatch, tmp_path)
    meta["evaluation"]["test_accuracy"] = 0.45
    path.write_text(json.dumps(meta))
    with pytest.raises(ValueError, match="performance"):
        reg.register(path, acknowledge_licensing=True)
