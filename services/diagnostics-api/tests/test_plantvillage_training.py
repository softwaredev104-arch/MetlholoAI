import json
import pytest
from scripts.train_plantvillage import select_labels, proposed_manifest

SHA = "a" * 40
WEIGHTS = "b" * 64
CLASSES = [
    "Corn_(maize)___healthy", "Corn_(maize)___Northern_Leaf_Blight",
    "Tomato___healthy", "Potato___Early_blight",
]


def test_uses_actual_label_names_not_guessed_disease_categories():
    assert select_labels(CLASSES, ["maize"]) == CLASSES[:2]
    assert select_labels(CLASSES, []) == CLASSES
    assert select_labels(CLASSES, ["tomato", "maize"]) == CLASSES[:3]
    with pytest.raises(ValueError, match="Unsupported"):
        select_labels(CLASSES, ["cattle"])
    with pytest.raises(ValueError, match="no classes"):
        select_labels(["Tomato___healthy"], ["maize"])


def test_manifest_requires_real_weight_digest_and_keeps_model_off():
    manifest = proposed_manifest(
        model_id="plantvillage-maize-v1", weights_name="model.onnx",
        weights_sha256=WEIGHTS, labels_name="labels.json",
        data_revision=SHA, classes=CLASSES[:2],
        counts=dict.fromkeys(CLASSES[:2], 9),
        metrics={"test_accuracy": .91, "test_examples": 12},
        crop_names=["maize"], training_seed=42, epochs=3,
    )
    assert manifest["license_verified"] is False
    assert manifest["validated_for_botswana"] is False
    assert manifest["category"] == "crops"
    assert manifest["subject"] == "Maize"
    assert manifest["normalization"] == "imagenet"
    assert manifest["input_layout"] == "NCHW"
    assert manifest["capture_examples"] == []
    assert manifest["dataset_revision"] == SHA


def test_rejects_unpinned_training_or_untrained_classes():
    kwargs = dict(
        model_id="plantvillage-maize-v1", weights_name="weights.onnx",
        weights_sha256=WEIGHTS, labels_name="labels.json",
        data_revision=SHA, classes=CLASSES[:2],
        counts={CLASSES[0]: 5, CLASSES[1]: 5}, metrics={}, crop_names=["maize"],
        training_seed=42, epochs=1,
    )
    with pytest.raises(ValueError, match="Pin"):
        proposed_manifest(**{**kwargs, "data_revision": "main"})
    with pytest.raises(ValueError, match="all contain"):
        proposed_manifest(**{**kwargs, "counts": {CLASSES[0]: 5}})
    with pytest.raises(ValueError, match="Unsafe"):
        proposed_manifest(**{**kwargs, "model_id": "../escape"})
