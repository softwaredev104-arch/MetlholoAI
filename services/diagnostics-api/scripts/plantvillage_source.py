"""Get *real* PlantVillage color images from publisher train/test manifests.

The modern Hugging Face default parquet contains path metadata, not pixels.
Download only needed images using publisher split manifests and a pinned
original GitHub dataset commit. Never relabel or infer a train/test split.
"""
from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path
from urllib.parse import quote


HF_DATASET = "mohanty/PlantVillage"
# Original PlantVillage GitHub tree used by the pinned reference photos.
SOURCE_IMAGE_COMMIT = "7f7ecc7e1eaca78107e3affe7cb5abd9427e139a"
RAW_BASE = ("https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/"
            + SOURCE_IMAGE_COMMIT + "/")
CROP_PREFIXES = {
    "maize": "Corn_(maize)___",
    "tomato": "Tomato___",
    "potato": "Potato___",
    "pepper": "Pepper,_bell___",
    "grape": "Grape___",
    "apple": "Apple___",
}


def image_class(path: str) -> str:
    pieces = path.strip().replace("\\", "/").split("/")
    if len(pieces) != 4 or pieces[:2] != ["raw", "color"]:
        raise ValueError("Unsafe or non-color source path")
    if pieces[2] in ("", ".", "..") or pieces[3] in ("", ".", ".."):
        raise ValueError("Invalid dataset path")
    return pieces[2]


def pick_paths(paths: list[str], crops: list[str], max_per_class: int,
               seed: int) -> dict[str, list[str]]:
    from collections import defaultdict
    prefixes = tuple(CROP_PREFIXES[c] for c in crops) if crops else ()
    groups: dict[str, list[str]] = defaultdict(list)
    for path in paths:
        path = path.strip()
        if not path.startswith("raw/color/"):
            continue
        label = image_class(path)
        if prefixes and not label.startswith(prefixes):
            continue
        groups[label].append(path)
    rng = random.Random(seed)
    return {
        label: sorted((rng.sample(paths, min(max_per_class, len(paths)))
                       if max_per_class else paths))
        for label, paths in sorted(groups.items())
    }


def _leaf_id(relative: str, mapping: dict) -> str:
    label = image_class(relative)
    identifier = relative.rsplit("/", 1)[-1].replace("_final_masked", "")
    identifier = identifier.split("___")[-1].split("copy")[0]
    identifier = identifier.rsplit(".", 1)[0].lower().strip()
    suggestions = mapping.get(identifier, [])
    if isinstance(suggestions, list):
        if len(suggestions) == 1 and isinstance(suggestions[0], str):
            return suggestions[0]
        for suggestion in suggestions:
            if isinstance(suggestion, str) and label in suggestion:
                return suggestion
    # Deterministic fallback, never mark as verified grouping metadata.
    return label + "::" + identifier


def load_pinned_color_splits(revision: str, crops: list[str],
                             max_train: int, max_test: int,
                             seed: int, cache: Path):
    import requests
    from datasets import ClassLabel, Dataset, Features, Image, Value
    from huggingface_hub import hf_hub_download
    cache.mkdir(parents=True, exist_ok=True)
    def hf_file(name: str) -> Path:
        return Path(hf_hub_download(
            repo_id=HF_DATASET, filename=name, repo_type="dataset",
            revision=revision,
        ))
    train_names = hf_file("splits/color_train.txt").read_text().splitlines()
    test_names = hf_file("splits/color_test.txt").read_text().splitlines()
    mapping = json.loads(hf_file("leaf_grouping/leaf-map.json").read_text())
    train_groups = pick_paths(train_names, crops, max_train, seed)
    test_groups = pick_paths(test_names, crops, max_test, seed + 1)
    labels = sorted(train_groups)
    if len(labels) < 2 or set(labels) != set(test_groups):
        raise ValueError("Insufficient/mismatched real publisher classes")
    if any(not train_groups[label] or not test_groups[label] for label in labels):
        raise ValueError("Empty real train/test class")
    train_paths = [p for label in labels for p in train_groups[label]]
    test_paths = [p for label in labels for p in test_groups[label]]
    if set(train_paths) & set(test_paths):
        raise ValueError("Publisher train/test duplicate image path")
    train_leaves = {_leaf_id(p, mapping) for p in train_paths}
    test_leaves = {_leaf_id(p, mapping) for p in test_paths}
    if train_leaves & test_leaves:
        raise ValueError("Publisher train/test physical-leaf leakage")
    print(f"pinned_dataset_revision={revision} pinned_source_images={SOURCE_IMAGE_COMMIT} "
          f"real_train_images={len(train_paths)} real_test_images={len(test_paths)}",
          flush=True)

    def local_image(relative: str, session: requests.Session) -> str:
        image_class(relative)
        dest = cache / relative
        if dest.is_file() and dest.stat().st_size > 500:
            return str(dest)
        dest.parent.mkdir(parents=True, exist_ok=True)
        url = RAW_BASE + quote(relative, safe="/")
        response = session.get(url, timeout=45)
        response.raise_for_status()
        content = response.content
        if len(content) < 500 or len(content) > 12 * 1024 * 1024:
            raise ValueError("Invalid or excessive source photograph")
        from PIL import Image as PILImage
        from io import BytesIO
        with PILImage.open(BytesIO(content)) as img:
            img.verify()
        tmp = dest.with_suffix(dest.suffix + ".part")
        tmp.write_bytes(content)
        tmp.replace(dest)
        return str(dest)

    features = Features({
        "image": Image(),
        "label": ClassLabel(names=labels),
        "leaf_id": Value("string"),
    })
    label_ids = {label: i for i, label in enumerate(labels)}
    def create(paths: list[str], session: requests.Session):
        columns = {"image": [], "label": [], "leaf_id": []}
        for i, path in enumerate(paths):
            columns["image"].append(local_image(path, session))
            columns["label"].append(label_ids[image_class(path)])
            columns["leaf_id"].append(_leaf_id(path, mapping))
            if (i + 1) % 100 == 0:
                print(f"verified_image_downloads={i + 1}/{len(paths)}", flush=True)
        return Dataset.from_dict(columns, features=features)
    with requests.Session() as session:
        session.headers.update({"User-Agent": "MetlholoAI-research-training/0.1"})
        training = create(train_paths, session)
        testing = create(test_paths, session)
    return training, testing
