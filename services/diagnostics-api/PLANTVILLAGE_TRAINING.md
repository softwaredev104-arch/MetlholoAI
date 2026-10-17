# PlantVillage → ONNX for MetlholoAI (real training, no mock classes)

The [original GitHub dataset](https://github.com/spMohanty/PlantVillage-Dataset)
contains photos and labels; **it does not itself install a trained model or
make the scanner usable**. The dataset maintainers recommend using the
`mohanty/PlantVillage` Hugging Face mirror and its official train/test splits
that keep the *same leaf* out of both groups.

The in-repository training utility uses those publisher-provided splits,
checks that class labels are real, trains MobileNetV3-Small from scratch, evaluates
a held-out set, and exports NCHW/ImageNet-normalized ONNX logits with a checksum
and exact label order. This is a real training/export procedure, not an
inference simulation. No pre-trained weights are silently downloaded.

## On a machine with enough disk, RAM and GPU/CPU training time

1. Review PlantVillage dataset/derived-work obligations; the dataset card lists
   **CC BY-SA 3.0**. Review commercial rights and any required attribution.
2. Pin an exact 40-character revision of the published dataset instead of
   using mutable `main`.
3. Train selected crop classes or all 38, e.g.:

```bash
cd services/diagnostics-api
python -m pip install -r requirements-train.txt
python -m scripts.train_plantvillage \
  --revision <EXACT_40_CHARACTER_DATASET_COMMIT_SHA> \
  --crop maize --model-id plantvillage-maize-v1 \
  --epochs 12 --min-test-accuracy 0.65
```

For all 38 labels omit `--crop` and use a new model ID. Do not pass
`--crop` multiple times unless a **single model** is intended to classify
across those crops. The exported model and labels are saved in the gitignored
`models/` directory along with `*.manifest.json`. The manifest is always
`license_verified: false` and `validated_for_botswana: false`.

4. Verify license compatibility, real evaluation quality, held-out Botswana
   field images and whether the operator will allow use in production. When
   authorized, set `license_verified` after review in a separately managed
   approved private registry. Do NOT set `validated_for_botswana` until
   validation is complete. Avoid publishing a poor research model as definitive.
5. Deploy the ONNX file, labels and approved registry to a real HTTPS Python
   gateway (not a static Cloudflare Worker), and configure Firebase Admin,
   CORS and `EXPO_PUBLIC_AI_GATEWAY_URL` in the web build.

The existing `scripts/install_public_models.py` also supports a verified-hash
five-class community crop candidate from Hugging Face. That candidate is
**not** the same thing as a full PlantVillage 38-class model. Its declared
license and training dataset remain subject to independent review.

PlantVillage classes do NOT cover Fall Armyworm, grasshoppers, cattle, or poultry.
Do not map those names to a PlantVillage classifier, invent symptoms, or
relable an unrelated disease as a detected class. A ready model is shown only
when its real weights and server have been installed and verified.


## Activate a trained model (on the Python inference host)

After running `scripts.train_plantvillage` with an exact dataset revision and
reviewing actual held-out accuracy, stage the ONNX weights, labels, and
`*.manifest.json` files together under `models/`. Then run:

```bash
# Non-ready registry entry by default (no public claims):
python -m scripts.register_plantvillage models/plantvillage-maize-v1.manifest.json

# Only after checking commercial redistribution rights, source attribution,
# training metadata, and any share-alike obligations:
python -m scripts.register_plantvillage models/plantvillage-maize-v1.manifest.json --acknowledge-licensing
METLHOLO_MODEL_REGISTRY_PATH=registry.approved.json uvicorn app:app --host 0.0.0.0 --port 8011
```

Registration checks class count, the model's exact SHA256 hash and held-out
metrics. It never marks `validated_for_botswana` true, even after approval.
Configure Firebase Admin credentials and CORS for any public HTTPS deployment;
never enable `METLHOLO_DEV_NO_AUTH` publicly. Existing model records and
legacy endpoints are preserved. Static Cloudflare Workers cannot execute
this Python/ONNX FastAPI service; you must provide an HTTPS Python host.


## October 2026 interruption recovery and GitHub training runner

The first bounded maize run is executed by
[`Train PlantVillage Maize Research Candidate`](../../.github/workflows/train-plantvillage-pilot.yml)
on introduction of that workflow to `feat/diagnostics-model-gateway`.
Later runs are manually started from the GitHub Actions workflow page with
the supported crop and a chosen epoch count.

What happens in a **real** training run:

- Hugging Face returns a concrete 40-character revision, recorded in
  `dataset-revision.txt`; train and held-out test both use that revision.
- Official PlantVillage **physical-leaf-disjoint** train/test splits are
  retained; train/test membership is never rebuilt by splitting individual
  photographs. The pilot caps counts per class after the official split.
- Training uses CPU MobileNetV3-Small from scratch and real dataset labels.
  It does not reuse existing Teachable Machine weights or invent metrics.
- Each completed epoch writes a trusted `*.checkpoint.pt` containing model
  and optimizer weights, class order, dataset revision, seed and epoch.
  Resume is supported with `--resume-from` for the **same** model, classes,
  seed, revision and a higher total `--epochs`. Only load checkpoints
  created by this trusted workflow.
- An `*.evaluation.json` records accuracy, class counts and pass/fail status
  even when held-out accuracy is below the minimum. A rejected run does not
  export an ONNX candidate.
- An accepted run produces versioned `*.onnx`, `*.labels.json`,
  `*.manifest.json`, and a checksum. The workflow retains these outputs as
  GitHub Actions **artifacts** for 30 days, not source-control commits.
- **No new model is automatically placed in the live registry**. License
  obligations, Botswana field-image validation, professional review and a
  separately deployed inference server remain prerequisites.

The bounded pilot is deliberately smaller than a production study. Its
held-out accuracy is a *screening* number, not independent local field
validation. Train with the full official split and repeat independent
evaluation before requesting production approval.

### Legacy weights and training-image limitations

Older `loetolex/Botswana-Agricultural-Intelligence-Platform-*` repositories
contain TensorFlow.js Teachable Machine `model.json`, `weights.bin`, and
`metadata.json` bundles with existing class labels. These are **already
trained weights**, not the original labelled images, optimizer states or
training logs. They cannot simply be 'trained again' without separately
obtaining labelled datasets and documenting licenses. In particular, several
cattle workflow paths point to identical binary weights. Treat those as the
same underlying classifier until independently evaluated. Those bundles are
not replaced or activated by this PlantVillage run.

For pest, cattle and poultry training, source a separate species-appropriate
licensed dataset with sound class definitions and a clean hold-out. PlantVillage
crop images must not be relabelled as animal disease or pest images.
