import io
import zipfile

import pytest
from PIL import Image

from scripts.plantvillage_archive import (
    parse_rgb_split, prepare_splits_from_files,
    _lookup_leaf_id,
)


def jpeg() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (12, 12), color=(42, 127, 31)).save(buffer, "JPEG")
    return buffer.getvalue()


def test_real_pinned_archive_split_labels_and_photos(tmp_path):
    train = [
        "raw/color/Corn_(maize)___healthy/a.jpg",
        "raw/color/Corn_(maize)___Northern_Leaf_Blight/b.jpg",
    ]
    test = [
        "raw/color/Corn_(maize)___healthy/c.jpg",
        "raw/color/Corn_(maize)___Northern_Leaf_Blight/d.jpg",
    ]
    archive = tmp_path / "official.zip"
    with zipfile.ZipFile(archive, "w") as z:
        for path in train + test:
            z.writestr(path, jpeg())

    mapping = {"a": ["leaf-1"], "b": ["leaf-2"], "c": ["leaf-3"], "d": ["leaf-4"]}
    training, testing = prepare_splits_from_files(archive, train, test, mapping)
    assert training.features["label"].names == sorted([
        "Corn_(maize)___healthy", "Corn_(maize)___Northern_Leaf_Blight"
    ])
    assert training.verified_group_count == 2
    assert testing.verified_group_count == 2
    assert training[0]["image"].mode == "RGB"
    assert training[0]["image"].size == (12, 12)
    assert set(training["leaf_id"]).isdisjoint(testing["leaf_id"])
    assert {training[0]["label"], training[1]["label"]} == {0, 1}


def test_archive_may_have_one_enclosing_folder(tmp_path):
    train = ["raw/color/A___ok/a.jpg", "raw/color/B___bad/b.jpg"]
    test = ["raw/color/A___ok/c.jpg", "raw/color/B___bad/d.jpg"]
    archive = tmp_path / "nested.zip"
    with zipfile.ZipFile(archive, "w") as z:
        for path in train + test:
            z.writestr("source-data/" + path, jpeg())
    training, testing = prepare_splits_from_files(archive, train, test, {})
    assert len(training) == 2
    assert testing[1]["image"].size == (12, 12)


def test_rejects_fake_missing_split_and_path_traversal(tmp_path):
    with pytest.raises(ValueError, match="Unsafe"):
        parse_rgb_split("raw/color/../../bad.jpg")
    with pytest.raises(ValueError, match="Unsafe"):
        parse_rgb_split("raw/grayscale/Corn___healthy/a.jpg")
    with pytest.raises(ValueError, match="Duplicate"):
        parse_rgb_split("raw/color/A___healthy/a.jpg\nraw/color/A___healthy/a.jpg")
    archive = tmp_path / "empty.zip"
    with zipfile.ZipFile(archive, "w") as z:
        z.writestr("empty", b"")
    with pytest.raises(ValueError, match="unambiguous"):
        prepare_splits_from_files(
            archive,
            ["raw/color/A___healthy/a.jpg", "raw/color/B___bad/b.jpg"],
            ["raw/color/A___healthy/c.jpg", "raw/color/B___bad/d.jpg"], {},
        )


def test_never_reuses_unknown_group_as_shared_physical_leaf():
    first, verified = _lookup_leaf_id("raw/color/Corn___healthy/unknown1.jpg", {})
    second, verified2 = _lookup_leaf_id("raw/color/Corn___healthy/unknown2.jpg", {})
    assert first != second
    assert not verified and not verified2
