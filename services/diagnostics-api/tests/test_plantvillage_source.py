import pytest
from scripts.plantvillage_source import image_class, pick_paths, _leaf_id


def test_source_image_path_is_strictly_scoped():
    assert image_class("raw/color/Corn_(maize)___healthy/sample.jpg") == "Corn_(maize)___healthy"
    for bad in ("../../secrets", "raw/segmented/leaf.jpg", "raw/color/../x.jpg"):
        with pytest.raises(ValueError):
            image_class(bad)


def test_balanced_publisher_subset_is_deterministic():
    source = ([f"raw/color/Corn_(maize)___healthy/h{i}.jpg" for i in range(8)]
              + [f"raw/color/Corn_(maize)___rust/r{i}.jpg" for i in range(9)]
              + ["raw/color/Tomato___healthy/other.jpg"])
    a = pick_paths(source, ["maize"], 3, 42)
    b = pick_paths(source, ["maize"], 3, 42)
    assert a == b
    assert list(a) == ["Corn_(maize)___healthy", "Corn_(maize)___rust"]
    assert all(len(xs) == 3 for xs in a.values())
    assert not any("other.jpg" in s for group in a.values() for s in group)


def test_leaf_group_mapping_and_deterministic_fallback():
    filename = "raw/color/Corn_(maize)___healthy/a___RStest123.JPG"
    assert _leaf_id(filename, {"rstest123": ["verified-leaf-17"]}) == "verified-leaf-17"
    assert _leaf_id(filename, {}).endswith("::rstest123")
