import hashlib
import io
import json

import pytest

from scripts import install_public_models as installer


def set_fake_model(monkeypatch, tmp_path, payload=b"onnx-fixture"):
    monkeypatch.setattr(installer, "ROOT", tmp_path)
    monkeypatch.setattr(installer, "MODELS", tmp_path / "models")
    mock_source = dict(installer.CANDIDATE)
    mock_source["weights_sha256"] = hashlib.sha256(payload).hexdigest()
    mock_source["weights_path"] = "models/community-crop-five-class-v1.onnx"
    mock_source["labels_path"] = "models/community-crop-five-class-v1.labels.json"
    monkeypatch.setattr(installer, "CANDIDATE", mock_source)
    monkeypatch.setattr(installer, "urlopen", lambda *args, **kwargs: io.BytesIO(payload))
    return mock_source


def test_public_model_requires_explicit_license_approval(monkeypatch, tmp_path):
    expected = set_fake_model(monkeypatch, tmp_path)
    manifest = installer.install()
    stored = json.loads(manifest.read_text())
    model = stored["models"][0]
    assert model["license_verified"] is False
    assert model["weights_sha256"] == expected["weights_sha256"]
    assert json.loads((tmp_path / expected["labels_path"]).read_text()) == expected["labels"]


def test_license_approval_does_not_mark_field_validation(monkeypatch, tmp_path):
    set_fake_model(monkeypatch, tmp_path)
    manifest = installer.install(acknowledge_licensing=True)
    model = json.loads(manifest.read_text())["models"][0]
    assert model["license_verified"] is True
    assert model["validated_for_botswana"] is False
    assert model["input_layout"] == "NHWC"
    assert model["output_type"] == "probabilities"


def test_corrupt_model_never_installed(monkeypatch, tmp_path):
    expected = set_fake_model(monkeypatch, tmp_path)
    expected["weights_sha256"] = "0" * 64
    with pytest.raises(ValueError, match="checksum mismatch"):
        installer.install(acknowledge_licensing=True)
    assert not (tmp_path / expected["weights_path"]).exists()
    assert not (tmp_path / "registry.approved.json").exists()
