# MetlholoAI — verified agricultural model training runs

This is an evidence ledger, **not** a model readiness catalogue. Never mark
a model as available merely because the training code or a checkpoint exists.

## Maize baseline — real training, rejected

- **GitHub Actions:** [Run 39059102573](https://github.com/softwaredev104-arch/MetlholoAI/actions/runs/39059102573)
- **Source:** `mohanty/PlantVillage`, revision `9e97599868962bd0079b8db4b7f1efa9185fa1e7`.
- **Split:** publisher official colour train/test lists, excluding overlap from TRAIN while preserving all TEST images. Logged exclusions: **290 training images across 227 overlapping leaf groups**.
- **Sample:** 600 real training images and 320 held-out images across four maize classes (150/class train, 80/class test).
- **Method:** MobileNetV3-Small, weights initialized from scratch, 3 epochs, seed 42.
- **Observed:** epoch losses 0.74967 → 0.46308 → 0.38928; held-out accuracy **0.2500 (80/320)**.
- **Decision:** **REJECTED** (minimum acceptance threshold 0.65), so no ONNX model was approved, installed, or published. Do not treat this as an operational crop-disease detector.
- **Recovery evidence:** [GitHub artifact](https://github.com/softwaredev104-arch/MetlholoAI/actions/runs/39059102573) (approximately 17 MB ZIP, includes research checkpoint and evaluation; available for the configured artifact retention period).

## Next research evaluation

An opt-in torchvision MobileNetV3-Small ImageNet1K_V1 initialization has
been added, with a frozen feature backbone and a newly trained crop-classifier
head. Initialization details are bound to checkpoint and model metadata so
checkpoints cannot be silently swapped between incompatible experiments.
The pretrained weights' provenance, licensing obligations, and derived-model
commercial distribution rights still require separate independent review.

Even if held-out PlantVillage accuracy improves, that does **not** validate
field photographs in Botswana. Domain-shift testing and professional review
are required before live farmer predictions can be enabled.

## Other existing agricultural models

Earlier agricultural repositories contain trained TensorFlow.js model bundles,
but their `model.json` / `weights.bin` / `metadata.json` files are not
source training datasets. Distinct model folders can share identical weights.
No cattle, poultry, insect or other livestock/pest classifier has been
retrained with invented PlantVillage labels.

## Restarting after interruptions

Use the branch's [Train PlantVillage Maize Research Candidate](https://github.com/softwaredev104-arch/MetlholoAI/actions/workflows/train-plantvillage-pilot.yml)
workflow for deliberate new experiments. Source revisions are pinned, completed
epochs save checkpoint files and `always()` uploads completed research artifacts.
A chat session closing does not interrupt a GitHub-hosted job; GitHub runner
cancellations/timeouts can still end the job, and uploads are not guaranteed if
a runner itself is terminated. Never claim otherwise. Resume only from an
intact, trusted checkpoint for matching model ID, dataset revision, class
order, initialization and random seed.
