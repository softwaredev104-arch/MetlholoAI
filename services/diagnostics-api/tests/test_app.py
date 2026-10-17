import io
import json

import pytest
from fastapi.testclient import TestClient
from PIL import Image

import app as diagnostics


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("METLHOLO_ENV", "development")
    monkeypatch.setenv("METLHOLO_DEV_NO_AUTH", "true")
    monkeypatch.setenv("METLHOLO_ROBOFLOW_INFERENCE_URL", "http://127.0.0.1:9001")
    return TestClient(diagnostics.app)


def photo():
    image = Image.new("RGB", (64, 64), color="green")
    content = io.BytesIO()
    image.save(content, "PNG")
    return content.getvalue()


def test_empty_registry_has_no_fake_predictions(client):
    response = client.get("/v1/models")
    assert response.status_code == 200
    assert response.json()["models"] == []
    missing = client.post(
        "/v1/predict",
        data={"model_id": "nonexistent"},
        files={"image": ("leaf.png", photo(), "image/png")},
    )
    assert missing.status_code == 404


def test_auth_required_by_default(monkeypatch):
    monkeypatch.setenv("METLHOLO_ENV", "production")
    monkeypatch.setenv("METLHOLO_DEV_NO_AUTH", "true")
    response = TestClient(diagnostics.app).get("/v1/models")
    assert response.status_code == 401


def test_manifest_not_ready_without_validated_license(client, monkeypatch):
    monkeypatch.setattr(diagnostics, "_model_registry", lambda: [{
        "id": "research", "display_name": "Research only", "category": "pests",
        "subject": "Maize", "provider": "roboflow", "model_id": "public/1",
        "license": "unverified", "license_verified": False,
    }])
    response = client.get("/v1/models")
    assert response.status_code == 200
    assert response.json()["models"][0]["ready"] is False
    assert client.post(
        "/v1/predict", data={"model_id": "research"},
        files={"image": ("leaf.png", photo(), "image/png")}
    ).status_code == 503


def test_roboflow_normalization_and_review_status(client, monkeypatch):
    monkeypatch.setattr(diagnostics, "_model_registry", lambda: [{
        "id": "test-model", "display_name": "Experimental field classifier",
        "category": "crops", "subject": "Maize", "provider": "roboflow",
        "model_id": "public/1", "license": "test-license", "license_verified": True,
        "validated_for_botswana": False,
    }])
    monkeypatch.setattr(diagnostics, "_roboflow_predictions", lambda *args: [
        {"label": "rust", "confidence": 0.83},
        {"label": "healthy", "confidence": 0.14},
    ])
    response = client.post(
        "/v1/predict", data={"model_id": "test-model"},
        files={"image": ("leaf.png", photo(), "image/png")},
    )
    assert response.status_code == 200
    value = response.json()
    assert value["prediction"] == "rust"
    assert value["confidence"] == 0.83
    assert value["reviewRequired"] is True
    assert value["status"] == "ai_suggestion_not_confirmed"
    assert value["validatedForBotswana"] is False


def test_uncertain_output_and_no_outbreak_claim(client, monkeypatch):
    monkeypatch.setattr(diagnostics, "_model_registry", lambda: [{
        "id": "test-model", "display_name": "Experimental field classifier",
        "category": "crops", "subject": "Maize", "provider": "roboflow",
        "model_id": "public/1", "license": "test-license", "license_verified": True,
    }])
    monkeypatch.setattr(diagnostics, "_roboflow_predictions", lambda *args: [
        {"label": "unreliable", "confidence": 0.23}
    ])
    response = client.post(
        "/v1/predict", data={"model_id": "test-model"},
        files={"image": ("leaf.png", photo(), "image/png")},
    ).json()
    assert response["prediction"] == "Uncertain"
    report = client.post("/v1/report", json={
        "modelId": "test-model", "disease": "Uncertain", "confidence": 0.23,
        "country": "Botswana", "cropOrAnimal": "Maize",
    })
    assert report.status_code == 200
    text = json.dumps(report.json())
    assert "no public alert issued" in text
    assert "treatment" in text.lower() or "professional" in text.lower()


def test_invalid_upload_rejected(client, monkeypatch):
    monkeypatch.setattr(diagnostics, "_model_registry", lambda: [{
        "id": "test-model", "display_name": "Test", "category": "crops",
        "subject": "Maize", "provider": "roboflow", "model_id": "public/1",
        "license": "test", "license_verified": True,
    }])
    response = client.post(
        "/v1/predict", data={"model_id": "test-model"},
        files={"image": ("x.jpg", b"not an image", "image/jpeg")},
    )
    assert response.status_code == 415


def test_capture_example_provenance_is_enforced(client, monkeypatch):
    photo = {
        "image_url": "https://images.example.org/leaf.jpg",
        "source_url": "https://research.example.org/training/leaf",
        "title": "Clear leaf view", "attribution": "Research project",
        "license": "CC BY 4.0", "redistribution_allowed": True,
    }
    monkeypatch.setattr(diagnostics, "_model_registry", lambda: [{
        "id": "example-model", "display_name": "Example model",
        "category": "crops", "subject": "Maize", "provider": "roboflow",
        "model_id": "public/1", "license": "test", "license_verified": True,
        "capture_examples": [
            {**photo, "kind": "verified_training"},  # Must be rejected
            {**photo, "kind": "verified_training",
             "training_membership_verified": True},
            {**photo, "kind": "licensed_reference", "redistribution_allowed": False},
            {**photo, "kind": "licensed_reference", "image_url": "http://not-https/image.jpg"},
        ],
    }])
    result = client.get("/v1/models")
    assert result.status_code == 200
    examples = result.json()["models"][0]["capture_examples"]
    assert len(examples) == 1
    assert examples[0]["kind"] == "verified_training"
    assert examples[0]["training_membership_verified"] is True


def test_uninstalled_models_never_publish_image_examples(client, monkeypatch):
    monkeypatch.setattr(diagnostics, "_model_registry", lambda: [{
        "id": "unavailable", "display_name": "Unavailable",
        "category": "crops", "subject": "Maize", "provider": "onnx",
        "license_verified": False, "license": "pending",
        "capture_examples": [{"image_url": "https://example.org/leaf.jpg"}],
    }])
    data = client.get("/v1/models").json()["models"][0]
    assert data["ready"] is False
    assert data["capture_examples"] == []
