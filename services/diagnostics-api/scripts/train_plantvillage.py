"""Train a REAL PlantVillage crop classifier and export it as an ONNX gateway model.

Dataset provenance: https://github.com/spMohanty/PlantVillage-Dataset
Mirror with *leaf-disjoint* official splits: mohanty/PlantVillage on Hugging Face.
This script never labels untrained/random weights as a model, never approves
licensing automatically, and never claims Botswana field validation.
Train manually on a machine with enough RAM/compute, outside the static Worker.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATASET_ID = "mohanty/PlantVillage"
SOURCE_REPO = "https://github.com/spMohanty/PlantVillage-Dataset"
CROP_PREFIXES = {
    "maize": "Corn_(maize)___",
    "tomato": "Tomato___",
    "potato": "Potato___",
    "pepper": "Pepper,_bell___",
    "grape": "Grape___",
    "apple": "Apple___",
}
SAFE_REVISION = re.compile(r"^[a-f0-9]{40}$")
SAFE_MODEL_ID = re.compile(r"^[a-z][a-z0-9-]{2,63}$")


def select_labels(all_labels: list[str], crops: list[str]) -> list[str]:
    """Never invent class labels that are absent from the pinned dataset."""
    if not all_labels or len(set(all_labels)) != len(all_labels):
        raise ValueError("Invalid/duplicate source class labels")
    if not crops:
        return list(all_labels)
    unknown = set(crops) - CROP_PREFIXES.keys()
    if unknown:
        raise ValueError("Unsupported PlantVillage crop: " + ", ".join(sorted(unknown)))
    prefixes = tuple(CROP_PREFIXES[crop] for crop in crops)
    chosen = [name for name in all_labels if name.startswith(prefixes)]
    if not chosen:
        raise ValueError("Selected crops have no classes in the source dataset")
    return chosen


def sample_by_class(
    labels: list[int], selected_old_ids: dict[int, int], limit: int, seed: int,
) -> list[int]:
    """Balanced, seeded subset without altering publisher train/test membership."""
    randomizer = random.Random(seed)
    groups: dict[int, list[int]] = {old: [] for old in selected_old_ids}
    for index, label in enumerate(labels):
        if label in groups:
            groups[label].append(index)
    if any(not values for values in groups.values()):
        raise ValueError("One or more selected classes have zero source images")
    for values in groups.values():
        randomizer.shuffle(values)
    return sorted(index for values in groups.values()
                  for index in (values[:limit] if limit else values))


def classification_metrics(
    classes: list[str], actual: list[int], predicted: list[int],
) -> dict[str, Any]:
    """Class-level metrics on held-out photos; never infer missing predictions."""
    if not classes or not actual or len(actual) != len(predicted):
        raise ValueError("Class metrics require real matched predictions and labels")
    count = len(classes)
    confusion = [[0 for _ in range(count)] for _ in range(count)]
    for true, predicted_class in zip(actual, predicted):
        if not (0 <= true < count and 0 <= predicted_class < count):
            raise ValueError("Evaluation label outside trained class mapping")
        confusion[true][predicted_class] += 1
    rows = {}
    precisions, recalls, f1s = [], [], []
    for i, name in enumerate(classes):
        tp = confusion[i][i]
        support = sum(confusion[i])
        predicted_count = sum(row[i] for row in confusion)
        precision = tp / predicted_count if predicted_count else 0.0
        recall = tp / support if support else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        precisions.append(precision)
        recalls.append(recall)
        f1s.append(f1)
        rows[name] = {
            "support": support,
            "precision": round(precision, 6),
            "recall": round(recall, 6),
            "f1": round(f1, 6),
        }
    return {
        "macro_precision": round(sum(precisions) / count, 6),
        "macro_recall": round(sum(recalls) / count, 6),
        "macro_f1": round(sum(f1s) / count, 6),
        "per_class": rows,
        "confusion_matrix": confusion,
        "confusion_matrix_labels": classes,
    }


def proposed_manifest(
    *, model_id: str, weights_name: str, weights_sha256: str, labels_name: str,
    data_revision: str, classes: list[str], counts: dict[str, int],
    metrics: dict[str, float], crop_names: list[str], training_seed: int,
    epochs: int, initialization: str = "from_scratch",
) -> dict[str, Any]:
    """Output is non-ready until operator reviews permissions and real weights."""
    if not SAFE_MODEL_ID.fullmatch(model_id):
        raise ValueError("Unsafe model id")
    if not SAFE_REVISION.fullmatch(data_revision):
        raise ValueError("Pin the exact 40-character dataset commit SHA")
    if not re.fullmatch(r"[a-f0-9]{64}", weights_sha256):
        raise ValueError("Invalid ONNX SHA256")
    if len(classes) < 2 or len(set(classes)) != len(classes):
        raise ValueError("A trained classifier must contain at least two unique labels")
    if not all(counts.get(name, 0) > 0 for name in classes):
        raise ValueError("Selected labels must all contain training examples")
    return {
        "id": model_id,
        "display_name": "PlantVillage " + (
            ", ".join(crop_names) if crop_names else "multi-crop"
        ) + " research classifier",
        "category": "crops",
        "subject": "Mixed crops" if len(crop_names) != 1 else crop_names[0].capitalize(),
        "provider": "onnx",
        "weights_path": "models/" + weights_name,
        "weights_sha256": weights_sha256,
        "labels_path": "models/" + labels_name,
        "license": "PlantVillage CC BY-SA 3.0 (confirm obligations before commercial use)",
        "license_verified": False,
        "validated_for_botswana": False,
        "input_size": 224, "input_layout": "NCHW",
        "normalization": "imagenet", "output_type": "logits",
        "threshold": 0.75,
        "training_source": SOURCE_REPO,
        "dataset_id": DATASET_ID,
        "dataset_revision": data_revision,
        "class_count": len(classes),
        "train_examples_by_class": counts,
        "evaluation": metrics,
        "seed": training_seed,
        "epochs": epochs,
        "initialization": initialization,
        "transfer_learning_requires_independent_rights_review": initialization != "from_scratch",
        "capture_examples": [],
    }


def train(args: argparse.Namespace) -> Path:
    if not SAFE_REVISION.fullmatch(args.revision):
        raise ValueError("--revision must be a pinned, 40-character dataset commit SHA")
    if (args.epochs < 1 or args.batch_size < 1 or args.workers < 0 or
            args.max_train_per_class < 0 or args.max_test_per_class < 0):
        raise ValueError("Invalid training configuration")
    if not SAFE_MODEL_ID.fullmatch(args.model_id):
        raise ValueError("Invalid model identifier")
    # Optional dependencies used ONLY on the model-training workstation.
    import numpy as np
    import torch
    from scripts.plantvillage_archive import load_pinned_plantvillage_splits
    from PIL import Image
    from torch import nn
    from torch.utils.data import DataLoader, Dataset
    from torchvision import models, transforms

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.use_deterministic_algorithms(True, warn_only=True)

    # These are provided by the dataset publisher. Do NOT independently
    # random-split at the image level: the same leaf could leak across sets.
    # Use real source RGB images + publisher's leaf-grouped splits.
    # Hugging Face's current default Parquet export has no image field.
    training, testing = load_pinned_plantvillage_splits(args.revision)
    print(f"dataset_source=pinned_official_color_zip "
          f"train={len(training)} test={len(testing)} "
          f"mapped_leaf_groups={training.verified_group_count}/"
          f"{len(training)}", flush=True)
    label_feature = training.features["label"]
    if not hasattr(label_feature, "names"):
        raise ValueError("Pinned dataset does not provide a verified ClassLabel")
    label_names = list(label_feature.names)
    if list(testing.features["label"].names) != label_names:
        raise ValueError("Publisher train/test labels do not match")
    classes = select_labels(label_names, args.crop)
    selected_old_ids = {label_names.index(label): i for i, label in enumerate(classes)}

    # The official grouping-disjoint test set remains held out during training.
    train_ids = sample_by_class(
        training["label"], selected_old_ids, args.max_train_per_class, args.seed,
    )
    test_ids = sample_by_class(
        testing["label"], selected_old_ids, args.max_test_per_class, args.seed + 1,
    )
    if not train_ids or not test_ids:
        raise ValueError("No real training/test examples for selected crops")
    counts = Counter(label_names[training["label"][i]] for i in train_ids)
    test_counts = Counter(label_names[testing["label"][i]] for i in test_ids)
    if len(test_counts) != len(classes):
        raise ValueError("Each selected class needs held-out test images")
    # Verify the actual physical-leaf identifiers in the split used for training.
    train_leaf_ids = {training["leaf_id"][i] for i in train_ids}
    test_leaf_ids = {testing["leaf_id"][i] for i in test_ids}
    if not all(train_leaf_ids) or not all(test_leaf_ids):
        raise ValueError("Missing source physical-leaf grouping identifiers")
    if train_leaf_ids & test_leaf_ids:
        raise ValueError("Train/test physical-leaf leakage detected")
    print(f"source_revision={args.revision} train_images={len(train_ids)} "
          f"held_out_images={len(test_ids)} classes={len(classes)}", flush=True)

    trans = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    class LeafSplit(Dataset):
        def __init__(self, data, indices):
            self.data, self.indices = data, indices
        def __len__(self):
            return len(self.indices)
        def __getitem__(self, i):
            entry = self.data[self.indices[i]]
            rgb = entry["image"].convert("RGB")
            return trans(rgb), selected_old_ids[entry["label"]]

    train_loader = DataLoader(
        LeafSplit(training, train_ids), batch_size=args.batch_size,
        shuffle=True, num_workers=args.workers,
    )
    test_loader = DataLoader(
        LeafSplit(testing, test_ids), batch_size=args.batch_size,
        shuffle=False, num_workers=args.workers,
    )
    # Optional, EXPLICIT transfer learning using PyTorch's named ImageNet
    # weights. Retain license_verified=False, including for pretrained runs.
    if args.backbone == "imagenet1k_v1":
        weights = models.MobileNet_V3_Small_Weights.IMAGENET1K_V1
        net = models.mobilenet_v3_small(weights=weights)
        for parameter in net.features.parameters():
            parameter.requires_grad_(False)
        initialization = "torchvision_mobilenet_v3_small_imagenet1k_v1"
    else:
        net = models.mobilenet_v3_small(weights=None)
        initialization = "from_scratch"
    net.classifier[-1] = nn.Linear(net.classifier[-1].in_features, len(classes))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    net.to(device)
    optimizer = torch.optim.AdamW(
        (param for param in net.parameters() if param.requires_grad),
        lr=args.learning_rate,
    )
    loss_fn = nn.CrossEntropyLoss()
    out = Path(args.output).resolve()
    out.mkdir(parents=True, exist_ok=True)
    checkpoint = out / (args.model_id + ".checkpoint.pt")
    start_epoch = 0
    if args.resume_from:
        # Resume ONLY user-trusted checkpoint artifacts from our own previous run.
        # weights_only blocks arbitrary Python object deserialization.
        state = torch.load(args.resume_from, map_location="cpu", weights_only=True)
        if (state.get("model_id") != args.model_id or
                state.get("dataset_revision") != args.revision or
                state.get("classes") != classes or
                state.get("seed") != args.seed or
                state.get("initialization", "from_scratch") != initialization):
            raise ValueError("Checkpoint does not match model, labels, seed and dataset revision")
        net.load_state_dict(state["model_state"])
        optimizer.load_state_dict(state["optimizer_state"])
        start_epoch = int(state["epoch"])
        if start_epoch < 0 or start_epoch >= args.epochs:
            raise ValueError("Checkpoint epoch invalid or already at target")
        print(f"Resuming from validated epoch={start_epoch}", flush=True)

    for epoch in range(start_epoch, args.epochs):
        net.train()
        if args.backbone == "imagenet1k_v1":
            # Frozen BatchNorm running statistics must remain fixed.
            net.features.eval()
        total_loss = 0.0
        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(net(images), targets)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.item())
        print(f"epoch={epoch + 1}/{args.epochs} mean_loss={total_loss / len(train_loader):.5f}", flush=True)
        # Last completed epoch remains recoverable even if the runner stops later.
        torch.save({
            "model_state": net.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "model_id": args.model_id,
            "dataset_revision": args.revision,
            "classes": classes,
            "seed": args.seed,
            "initialization": initialization,
            "epoch": epoch + 1,
        }, checkpoint)

    net.eval()
    correct = observed = 0
    actual_labels: list[int] = []
    predicted_labels: list[int] = []
    with torch.inference_mode():
        for images, targets in test_loader:
            logits = net(images.to(device)).cpu()
            choices = logits.argmax(1)
            correct += int((choices == targets).sum().item())
            observed += len(targets)
            actual_labels.extend(targets.tolist())
            predicted_labels.extend(choices.tolist())
    accuracy = correct / observed if observed else 0.0
    per_class_metrics = classification_metrics(classes, actual_labels, predicted_labels)
    print(f"held_out_leaf_disjoint_accuracy={accuracy:.4f} n={observed}", flush=True)
    # Always preserve truthful metrics, even when the resulting model is rejected.
    passed = accuracy >= max(args.min_test_accuracy, 0.5)
    results = {
        "status": "candidate_accepted_for_license_review" if passed else "rejected_low_accuracy",
        "model_id": args.model_id,
        "dataset_id": DATASET_ID, "dataset_revision": args.revision,
        "physical_leaf_disjoint": True,
        "classes": classes,
        "train_examples_by_class": dict(counts),
        "test_examples_by_class": dict(test_counts),
        "accuracy": round(accuracy, 6), "test_examples": observed,
        "detailed_metrics": per_class_metrics,
        "minimum_accuracy": args.min_test_accuracy,
        "epoch_count": args.epochs,
        "weights_initialized": initialization,
        "validated_for_botswana": False,
        "license_verified": False,
    }
    (out / (args.model_id + ".evaluation.json")).write_text(
        json.dumps(results, indent=2) + "\n", encoding="utf-8",
    )
    if accuracy < args.min_test_accuracy:
        raise ValueError("Held-out test accuracy below required acceptance threshold; weights not published")
    if accuracy < 0.5:
        raise ValueError("Model has not learned sufficiently; not exporting misleading weights")

    weights_name = args.model_id + ".onnx"
    labels_name = args.model_id + ".labels.json"
    weights_path = out / weights_name
    labels_path = out / labels_name
    net.cpu()
    torch.onnx.export(
        net, torch.zeros(1, 3, 224, 224),
        str(weights_path), opset_version=17,
        input_names=["image"], output_names=["logits"],
        dynamo=False,
    )
    labels_path.write_text(json.dumps(classes, indent=2) + "\n", encoding="utf-8")
    digest = hashlib.sha256(weights_path.read_bytes()).hexdigest()
    manifest = proposed_manifest(
        model_id=args.model_id,
        weights_name=weights_name, labels_name=labels_name,
        weights_sha256=digest, data_revision=args.revision,
        classes=classes, counts=dict(counts),
        metrics={"test_accuracy": round(accuracy, 6), "test_examples": observed,
                 "macro_f1": per_class_metrics["macro_f1"]},
        crop_names=args.crop, training_seed=args.seed, epochs=args.epochs,
        initialization=initialization,
    )
    manifest_path = out / (args.model_id + ".manifest.json")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Trained ONNX: {weights_path}; SHA256: {digest}")
    print(f"Disabled pending independent licensing/field review: {manifest_path}")
    return manifest_path


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--revision", required=True, help="Pinned HF PlantVillage dataset commit SHA")
    ap.add_argument("--crop", action="append", choices=sorted(CROP_PREFIXES),
                    default=[], help="Limit classes to one or more crops; default all 38")
    ap.add_argument("--model-id", default="plantvillage-multi-crop-v1")
    ap.add_argument("--output", default=str(ROOT / "models"))
    ap.add_argument("--epochs", type=int, default=12)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--workers", type=int, default=0)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--learning-rate", type=float, default=0.001)
    ap.add_argument("--min-test-accuracy", type=float, default=0.65)
    ap.add_argument("--max-train-per-class", type=int, default=0,
                    help="Seeded, class-balanced train cap; 0 means all images")
    ap.add_argument("--max-test-per-class", type=int, default=0,
                    help="Seeded, class-balanced held-out cap; 0 means all images")
    ap.add_argument("--backbone", choices=["scratch", "imagenet1k_v1"],
                    default="scratch",
                    help="Explicit ImageNet transfer learning; commercial rights require separate review")
    ap.add_argument("--resume-from", default="",
                    help="Trusted checkpoint from same dataset revision and class order")
    return ap.parse_args()


if __name__ == "__main__":
    train(parse_args())
