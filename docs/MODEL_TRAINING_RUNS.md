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

## Maize transfer-learning pilot — research acceptance passed

- **GitHub Actions:** [successful run 39059446470](https://github.com/softwaredev104-arch/MetlholoAI/actions/runs/39059446470)
- **Real data:** same pinned PlantVillage revision `9e97599868962bd0079b8db4b7f1efa9185fa1e7`, 600 training images and 320 held-out images across **four maize classes**.
- **Leakage control:** 290 overlapping publisher training images quarantined before sampling; 227 shared physical-leaf identifiers were detected and excluded from training.
- **Method:** MobileNetV3-Small with explicit torchvision ImageNet1K_V1 initialization, frozen feature backbone, new classifier head, six epochs.
- **Evaluation:** held-out accuracy **0.93125 (298/320)**; above the research acceptance threshold of 0.65, **not independently validated for Botswana fields**.
- **Export:** real ONNX binary (`plantvillage-maize-transfer-pilot-v1.onnx`, 6,097,437 bytes), labels and manifest plus trusted training checkpoint.
- **Verified SHA-256:** `639aa25fd5ad4d5c76394dbfbcc1d6da538d48d5609eb12c8aedb2bb560e6527` matches the saved ONNX file exactly. The research artifact ZIP passes integrity checks and contains the expected four class labels.
- **Artifact:** [download via the completed GitHub Actions run](https://github.com/softwaredev104-arch/MetlholoAI/actions/runs/39059446470).
- **Status:** `candidate_accepted_for_license_review`, with `license_verified: false`, `validated_for_botswana: false`. **NOT installed or served** as a production farmer-facing diagnostic.

## Five-crop transfer-learning batch — completed

[GitHub Actions run 39059694016](https://github.com/softwaredev104-arch/MetlholoAI/actions/runs/39059694016) trained five additional research classifiers from real colour PlantVillage images at the same pinned dataset revision. All were run for six epochs, passed the internal 0.65 acceptance threshold, exported separate ONNX weights and passed ONNX Runtime CPU smoke checks.

| Crop | Classes | Train photos | Held-out photos | Accuracy | ONNX SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| Tomato | 10 | 1,500 | 786 | 90.0763% | `3dbba5f00cc79b6c62fd35de36d6a91f481d4fc19e53d7089bef15542aa2a244` |
| Potato | 3 | 420 | 192 | 96.875% | `6832cb1559a0455362d5f4791444955de045b44ca470b6f66a2acee674f14217` |
| Pepper | 2 | 300 | 160 | 96.875% | `a879ce4da9047069d8b435f7a1083148fad07d1638fede21a9dd89bc38586653` |
| Grape | 4 | 600 | 320 | 99.0625% | `032f8ef7a195631d43e4850c84495c776fadc6486a44f20bc8e8fce44e58d759` |
| Apple | 4 | 600 | 292 | 97.9452% | `7abb2c5e70ebc571a464fbcd36c8dc8ed3995b6418f665f20cfd8a1125e0c0f9` |

These five join maize for **six trained candidate models and 27 distinct class labels**. The saved batch ZIP contains five independent model files, checkpoints, manifests, labels and evaluations; every model SHA-256 has been independently checked against its corresponding manifest. All of these are research outputs, not Botswana field validation, and remain **NOT active / NOT commercially approved**.

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
