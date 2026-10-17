"""Pinned PlantVillage official archive/split loader (no fake labels).

The Hugging Face datasets 'default' auto-export does not expose the original
image/leaf_id columns for the currently pinned dataset revision. The original
publisher's repository includes data.zip, official RGB split path lists, and
physical-leaf grouping metadata. Download all from ONE pinned dataset revision.
"""
from __future__ import annotations

import io
import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from types import SimpleNamespace
from typing import Any

from huggingface_hub import hf_hub_download

SOURCE_ID = "mohanty/PlantVillage"
REVISION_RE = re.compile(r"^[a-f0-9]{40}$")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def parse_rgb_split(text: str) -> list[str]:
    paths = []
    for raw in text.splitlines():
        entry = raw.strip().replace("\\", "/")
        if not entry:
            continue
        posix = PurePosixPath(entry)
        if (posix.is_absolute() or ".." in posix.parts or
                len(posix.parts) != 4 or posix.parts[0:2] != ("raw", "color") or
                posix.suffix.lower() not in IMAGE_EXTENSIONS):
            raise ValueError(f"Unsafe or non-RGB PlantVillage source path: {entry}")
        paths.append(entry)
    if len(paths) != len(set(paths)):
        raise ValueError("Duplicate paths in the publisher split")
    if not paths:
        raise ValueError("Empty publisher split")
    return paths


def _lookup_leaf_id(source_path: str, leaf_map: dict[str, Any]) -> tuple[str, bool]:
    """Match the source builder's leaf grouping, never equate 'unknown' IDs."""
    posix = PurePosixPath(source_path)
    class_name = posix.parts[2]
    file_name = posix.name.replace("_final_masked", "")
    identifier = file_name.split("___")[-1].split("copy")[0]
    for ext in (".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG"):
        if identifier.endswith(ext):
            identifier = identifier[: -len(ext)]
            break
    identifier = identifier.strip().lower()
    matches = leaf_map.get(identifier, [])
    if isinstance(matches, list) and matches:
        if len(matches) == 1 and isinstance(matches[0], str):
            return matches[0], True
        class_matches = [
            value for value in matches
            if isinstance(value, str) and class_name in value
        ]
        if len(class_matches) == 1:
            return class_matches[0], True
    # The publisher's split already preserves group membership. This fallback
    # is NOT independently verified physical-leaf provenance.
    return f"unmapped:{class_name}/{identifier}", False


def _archive_key(path: str, names: set[str]) -> str:
    if path in names:
        return path
    # Some published ZIPs have one enclosing directory.
    matches = [member for member in names if member.endswith("/" + path)]
    if len(matches) != 1:
        raise ValueError(f"Split image missing/ambiguous in pinned archive: {path}")
    return matches[0]


class ArchiveSplit:
    def __init__(
        self, archive_path: str, source_paths: list[str], ids: list[int],
        leaf_ids: list[str], all_classes: list[str], resolved_keys: list[str],
        verified_group_count: int,
    ):
        self.archive_path = archive_path
        self.source_paths = source_paths
        self.ids = ids
        self.leaf_ids = leaf_ids
        self.resolved_keys = resolved_keys
        self.verified_group_count = verified_group_count
        self.features = {"label": SimpleNamespace(names=all_classes)}
        self.column_names = ["image", "label", "leaf_id", "image_path"]
        self._archive: zipfile.ZipFile | None = None

    def __len__(self) -> int:
        return len(self.ids)

    def __getitem__(self, index: int | str):
        if index == "label":
            return self.ids
        if index == "leaf_id":
            return self.leaf_ids
        if index == "image_path":
            return self.source_paths
        if not isinstance(index, int):
            raise KeyError(index)
        if self._archive is None:
            self._archive = zipfile.ZipFile(self.archive_path)
        from PIL import Image
        with self._archive.open(self.resolved_keys[index]) as handle:
            photo = Image.open(io.BytesIO(handle.read())).convert("RGB")
        return {
            "image": photo, "label": self.ids[index],
            "leaf_id": self.leaf_ids[index],
            "image_path": self.source_paths[index],
        }


def prepare_splits_from_files(
    archive_path: str | Path, train_paths: list[str], test_paths: list[str],
    leaf_map: dict[str, Any],
) -> tuple[ArchiveSplit, ArchiveSplit]:
    if set(train_paths) & set(test_paths):
        raise ValueError("Publisher train/test paths overlap")
    labels = sorted({p.split("/")[2] for p in train_paths + test_paths})
    if len(labels) < 2:
        raise ValueError("Expected at least two real PlantVillage labels")
    ids = {label: index for index, label in enumerate(labels)}
    with zipfile.ZipFile(archive_path) as archive:
        members = set(archive.namelist())
        # Determine an optional ZIP root prefix ONCE. Scanning all 54k+
        # member names for every photo would be quadratic and extremely slow.
        first = train_paths[0]
        if first in members:
            prefix = ""
        else:
            candidates = [
                name[: -len(first)] for name in members
                if name.endswith("/" + first)
            ]
            if len(candidates) != 1:
                raise ValueError("Cannot find unambiguous original RGB archive root")
            prefix = candidates[0]
        train_keys = [prefix + path for path in train_paths]
        test_keys = [prefix + path for path in test_paths]
        if any(key not in members for key in train_keys + test_keys):
            raise ValueError("Official split lists reference missing archive images")

    def split(paths: list[str], keys: list[str]) -> ArchiveSplit:
        group_data = [_lookup_leaf_id(p, leaf_map) for p in paths]
        return ArchiveSplit(
            str(archive_path), paths, [ids[p.split("/")[2]] for p in paths],
            [group_id for group_id, _ in group_data], labels, keys,
            sum(int(verified) for _, verified in group_data),
        )

    train = split(train_paths, train_keys)
    test = split(test_paths, test_keys)
    # The pinned publisher manifests can contain shared physical leaf groups.
    # Keep the publisher's test set untouched, and quarantine every matching
    # group from TRAIN; never migrate test images into training.
    overlap = set(train.leaf_ids) & set(test.leaf_ids)
    if overlap:
        kept = [i for i, leaf in enumerate(train.leaf_ids) if leaf not in overlap]
        quarantined = len(train.leaf_ids) - len(kept)
        print(f"quarantined_training_images={quarantined} "
              f"overlapping_physical_leaf_groups={len(overlap)}", flush=True)
        if not kept:
            raise ValueError("No leakage-free training images remain")
        train = ArchiveSplit(
            train.archive_path,
            [train.source_paths[i] for i in kept],
            [train.ids[i] for i in kept],
            [train.leaf_ids[i] for i in kept],
            train.features["label"].names,
            [train.resolved_keys[i] for i in kept],
            sum(not train.leaf_ids[i].startswith("unmapped:") for i in kept),
        )
    if set(train.leaf_ids) & set(test.leaf_ids):
        raise ValueError("Unresolved physical-leaf leakage")
    return train, test


def load_pinned_plantvillage_splits(revision: str) -> tuple[ArchiveSplit, ArchiveSplit]:
    if not REVISION_RE.fullmatch(revision):
        raise ValueError("Require a pinned dataset revision")
    def download(path: str) -> str:
        return hf_hub_download(
            repo_id=SOURCE_ID, repo_type="dataset",
            filename=path, revision=revision,
        )
    source_archive = download("data.zip")
    train_list = Path(download("splits/color_train.txt")).read_text(encoding="utf-8")
    test_list = Path(download("splits/color_test.txt")).read_text(encoding="utf-8")
    leaf_map = json.loads(Path(download("leaf_grouping/leaf-map.json")).read_text(encoding="utf-8"))
    if not isinstance(leaf_map, dict):
        raise ValueError("Publisher leaf map must be a JSON object")
    return prepare_splits_from_files(
        source_archive, parse_rgb_split(train_list),
        parse_rgb_split(test_list), leaf_map,
    )
