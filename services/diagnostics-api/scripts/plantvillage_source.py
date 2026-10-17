"""Pinned, leaf-disjoint PlantVillage photo selection without downloading data.zip.

The current Hub auto-converted default configuration exposes only text paths,
not decoded photographs. Read the publisher's exact official split manifests
and leaf grouping, then fetch ONLY selected photos from a fixed source commit.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from urllib.parse import quote
from urllib.request import Request, urlopen

DATASET_ID = "mohanty/PlantVillage"
SOURCE_COMMIT = "7f7ecc7e1eaca78107e3affe7cb5abd9427e139a"
REVISION = re.compile(r"^[a-f0-9]{40}$")
EXTENSIONS = {".jpg", ".jpeg", ".png"}


@dataclass(frozen=True)
class Photo:
    path: str
    label: str
    leaf_id: str


def publisher_leaf_id(path: str, leaf_map: dict) -> str:
    """Follow the published plant_village.py grouping lookup exactly."""
    parts = PurePosixPath(path).parts
    class_name, filename = parts[2], parts[3]
    identifier = filename.replace("_final_masked", "")
    if "___" in identifier:
        identifier = identifier.split("___")[-1]
    identifier = identifier.split("copy")[0]
    for ext in (".jpg", ".JPG", ".png", ".PNG"):
        identifier = identifier.replace(ext, "")
    identifier = identifier.strip()
    suggestions = leaf_map.get(identifier.lower(), [])
    if len(suggestions) == 1:
        return str(suggestions[0])
    if suggestions:
        for suggestion in suggestions:
            if class_name in suggestion:
                return str(suggestion)
    return f"fallback_{identifier}"


def parse_official_split(lines: list[str], leaf_map: dict) -> list[Photo]:
    items: list[Photo] = []
    seen: set[str] = set()
    for raw in lines:
        path = raw.strip()
        if not path:
            continue
        parts = PurePosixPath(path).parts
        if (len(parts) != 4 or parts[:2] != ("raw", "color") or
                any(part in ("..", ".") for part in parts) or
                PurePosixPath(path).suffix.lower() not in EXTENSIONS or
                not re.fullmatch(r"[A-Za-z0-9_(),. %-]+", parts[2]) or
                not re.fullmatch(r"[A-Za-z0-9_(),. %+\\-]+", parts[3])):
            raise ValueError(f"Unsafe or unexpected PlantVillage path: {path}")
        if path in seen:
            raise ValueError("Duplicate image in publisher split: " + path)
        seen.add(path)
        items.append(Photo(path, parts[2], publisher_leaf_id(path, leaf_map)))
    if not items:
        raise ValueError("Publisher split is empty")
    return items


def choose_per_class(items: list[Photo], prefixes: list[str], maximum: int, seed: int) -> list[Photo]:
    if maximum < 0:
        raise ValueError("Negative sampling limit")
    selected = [item for item in items if not prefixes or item.label.startswith(tuple(prefixes))]
    grouped: dict[str, list[Photo]] = {}
    for item in selected:
        grouped.setdefault(item.label, []).append(item)
    if len(grouped) < 2:
        raise ValueError("Expected at least two real image classes for classifier")
    rand = random.Random(seed)
    output: list[Photo] = []
    for label in sorted(grouped):
        rows = grouped[label]
        rand.shuffle(rows)
        output.extend(rows[:maximum] if maximum else rows)
    return sorted(output, key=lambda item: item.path)


def get_official_selection(*, revision: str, crops: list[str],
                           max_train: int, max_test: int, seed: int):
    from huggingface_hub import hf_hub_download
    if not REVISION.fullmatch(revision):
        raise ValueError("Dataset revision must be an exact 40-character SHA")
    prefix_map = {
        "maize": "Corn_(maize)___", "tomato": "Tomato___",
        "potato": "Potato___", "pepper": "Pepper,_bell___",
        "grape": "Grape___", "apple": "Apple___",
    }
    unknown = set(crops).difference(prefix_map)
    if unknown:
        raise ValueError("Unsupported PlantVillage crops: " + ", ".join(sorted(unknown)))
    prefixes = [prefix_map[crop] for crop in crops]
    def download(name: str) -> Path:
        return Path(hf_hub_download(DATASET_ID, name, revision=revision, repo_type="dataset"))
    leaf_map = json.loads(download("leaf_grouping/leaf-map.json").read_text(encoding="utf-8"))
    train_all = parse_official_split(
        download("splits/color_train.txt").read_text(encoding="utf-8").splitlines(), leaf_map)
    test_all = parse_official_split(
        download("splits/color_test.txt").read_text(encoding="utf-8").splitlines(), leaf_map)
    train = choose_per_class(train_all, prefixes, max_train, seed)
    test = choose_per_class(test_all, prefixes, max_test, seed + 1)
    classes = sorted({row.label for row in train})
    if set(classes) != {row.label for row in test}:
        raise ValueError("Selected train and test classes differ")
    if {row.path for row in train} & {row.path for row in test}:
        raise ValueError("Same image appears in both official splits")
    shared = {row.leaf_id for row in train} & {row.leaf_id for row in test}
    if shared:
        raise ValueError(f"Physical leaf grouping overlaps train/test ({len(shared)} IDs)")
    return train, test, classes


def materialize_images(items: list[Photo], *, root: Path, workers: int = 8) -> dict[str, str]:
    """Download only approved paths; validate all images before training."""
    from PIL import Image
    root.mkdir(parents=True, exist_ok=True)
    hashes: dict[str, str] = {}

    def download_one(row: Photo) -> tuple[str, str]:
        destination = root / row.path
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            url = ("https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/"
                   + SOURCE_COMMIT + "/" + quote(row.path, safe="/"))
            for attempt in range(3):
                try:
                    request = Request(url, headers={"User-Agent": "MetlholoAI-Research/0.1"})
                    with urlopen(request, timeout=35) as response:
                        data = response.read(5_000_001)
                    if len(data) > 5_000_000 or not data:
                        raise ValueError("Invalid image size")
                    destination.write_bytes(data)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    time.sleep(attempt + 1)
        with Image.open(destination) as img:
            img.verify()
        return row.path, hashlib.sha256(destination.read_bytes()).hexdigest()

    with ThreadPoolExecutor(max_workers=workers) as pool:
        for path, digest in pool.map(download_one, items):
            hashes[path] = digest
    return hashes


class LocalPhotoSplit:
    def __init__(self, rows: list[Photo], classes: list[str], root: Path):
        self.rows = rows
        self.class_ids = {label: n for n, label in enumerate(classes)}
        self.root = root
        self.features = {"label": type("Labels", (), {"names": classes})()}

    def __getitem__(self, key):
        if key == "label":
            return [self.class_ids[row.label] for row in self.rows]
        if key == "leaf_id":
            return [row.leaf_id for row in self.rows]
        from PIL import Image
        row = self.rows[key]
        with Image.open(self.root / row.path) as image:
            return {"image": image.convert("RGB"),
                    "label": self.class_ids[row.label],
                    "leaf_id": row.leaf_id}

    def __len__(self):
        return len(self.rows)


def prepare_local_splits(*, revision: str, crops: list[str],
                         max_train: int, max_test: int, seed: int, root: Path):
    train, test, classes = get_official_selection(
        revision=revision, crops=crops, max_train=max_train, max_test=max_test, seed=seed)
    all_rows = {row.path: row for row in train + test}
    print(f"selected_real_photos={len(all_rows)} classes={len(classes)} "
          f"source_commit={SOURCE_COMMIT}", flush=True)
    hashes = materialize_images(list(all_rows.values()), root=root)
    evidence = {
        "dataset_id": DATASET_ID, "dataset_revision": revision,
        "image_source_commit": SOURCE_COMMIT,
        "train": [{"path": row.path, "label": row.label, "leaf_id": row.leaf_id,
                   "sha256": hashes[row.path]} for row in train],
        "test": [{"path": row.path, "label": row.label, "leaf_id": row.leaf_id,
                  "sha256": hashes[row.path]} for row in test],
        "source": "publisher_official_leaf_disjoint_split",
    }
    (root.parent / "plantvillage-source-selection.json").write_text(
        json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    return LocalPhotoSplit(train, classes, root), LocalPhotoSplit(test, classes, root)
