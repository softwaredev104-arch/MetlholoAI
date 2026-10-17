import json
import pytest
from scripts.train_plantvillage import select_labels, proposed_manifest, sample_by_class, classification_metrics

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


def test_seeded_class_balanced_sampling_retains_real_source_indices():
    # The input labels are from an already separated publisher split. Never
    # randomly redistribute individual photos between train and test.
    labels = [0] * 12 + [1] * 9 + [2] * 5
    choices = sample_by_class(labels, {0: 0, 2: 1}, limit=3, seed=123)
    assert len(choices) == 6
    assert sum(labels[i] == 0 for i in choices) == 3
    assert sum(labels[i] == 2 for i in choices) == 3
    assert choices == sample_by_class(labels, {0: 0, 2: 1}, limit=3, seed=123)
    assert set(choices).issubset(set(range(len(labels))))
    assert len(sample_by_class(labels, {0: 0, 2: 1}, limit=0, seed=123)) == 17


def test_no_training_sampling_without_real_class_images():
    with pytest.raises(ValueError, match="zero source images"):
        sample_by_class([0, 0, 1], {0: 0, 4: 1}, limit=2, seed=42)


def test_pretrained_backbone_manifest_remains_unapproved():
    manifest = proposed_manifest(
        model_id="plantvillage-maize-transfer-v1", weights_name="candidate.onnx",
        weights_sha256=WEIGHTS, labels_name="labels.json",
        data_revision=SHA, classes=CLASSES[:2],
        counts={CLASSES[0]: 25, CLASSES[1]: 25},
        metrics={"test_accuracy": 0.85, "test_examples": 20},
        crop_names=["maize"], training_seed=42, epochs=6,
        initialization="torchvision_mobilenet_v3_small_imagenet1k_v1",
    )
    assert manifest["initialization"] == "torchvision_mobilenet_v3_small_imagenet1k_v1"
    assert manifest["transfer_learning_requires_independent_rights_review"] is True
    assert manifest["license_verified"] is False
    assert manifest["validated_for_botswana"] is False


def test_detailed_holdout_metrics_are_computed_from_actual_predictions():
    result = classification_metrics(
        ["healthy", "blight", "rust"],
        actual=[0, 0, 1, 1, 2, 2],
        predicted=[0, 0, 1, 0, 2, 1],
    )
    assert result["per_class"]["healthy"]["recall"] == 1.0
    assert result["per_class"]["blight"]["recall"] == 0.5
    assert result["per_class"]["rust"]["recall"] == 0.5
    assert result["confusion_matrix"] == [[2, 0, 0], [1, 1, 0], [0, 1, 1]]
    assert result["macro_f1"] < 1.0


def test_detailed_holdout_metrics_reject_invalid_classes():
    with pytest.raises(ValueError):
        classification_metrics(["healthy", "blight"], [0, 2], [0, 1])
    with pytest.raises(ValueError):
        classification_metrics(["healthy", "blight"], [0], [])
