# MetlholoAI in-repository diagnostics service

This is a separate CPU/GPU Python inference service, **not a Vercel dependency**.
It sits in the same MetlholoAI GitHub project as the Expo application.
Firebase Authentication remains authoritative; farmer records, image references,
cases and reports remain in the user's Google Drive and local cache.

**Current integration:** licensed ONNX plant-image classifiers and selected
Roboflow classification/object-detection models through a self-hosted Roboflow
Inference server. There are NO model weights in this repository; the checked-in
registry intentionally has no active models. No model is represented as validated
for Botswana just because it appears in a public repository.

## Start locally

Use Python 3.11 in a virtual environment.

\`\`\`sh
cd services/diagnostics-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# For isolated, LOCAL tests only:
METLHOLO_ENV=development METLHOLO_DEV_NO_AUTH=true \
  uvicorn app:app --host 127.0.0.1 --port 8011
curl http://127.0.0.1:8011/health
\`\`\`

For any real browser/public deployment, **do not** enable the development
auth override. Set Google Application Default Credentials (or use a secure
workload identity) for Firebase Admin token verification and configure
METLHOLO_ALLOWED_ORIGINS to your Cloudflare preview origin.

\`\`\`sh
export METLHOLO_ENV=production
export METLHOLO_DEV_NO_AUTH=false
export METLHOLO_ALLOWED_ORIGINS=https://metlholoai-preview.jobebokang.workers.dev
uvicorn app:app --host 0.0.0.0 --port 8011
\`\`\`

The Expo web build is **static**; it cannot run ONNX/Python inference inside the
Cloudflare static asset. Deploy this service to a compatible Python container
or VM reachable over HTTPS (or a secured Cloudflare proxy pointing to one).
Set \`EXPO_PUBLIC_AI_GATEWAY_URL=https://YOUR-DIAGNOSTICS-SERVICE\`
in the Expo build. No Roboflow API key or Firebase Admin credential belongs in
an \`EXPO_PUBLIC_\` variable.

## Reproducible first public-weight candidate: maize/cassava/bean leaves

The in-repository installer supports a small [MIT-labelled crop model](https://huggingface.co/Gopina/maize-disease-classifier) containing **real ONNX weights** (approx. 3.8 MB). Its published classes are `healthy`, `maize_rust`, `maize_blight`, `cassava_mosaic` and `bean_spot`.

The published model uses a **224×224 NHWC float32 RGB input divided by 255**; the ONNX adapter now supports this layout, in addition to existing NCHW/ImageNet models.

**Important limitations:** The model author's model card claims perfect test metrics that we have not independently reproduced; it also explicitly notes synthetic augmentation for the bean class. Model licensing is described as MIT on the source card, but **training-dataset usage rights and dependency obligations still require review**. Do not treat this as Botswana-validated, medically definitive, or an official pest/disease report.

```bash
cd services/diagnostics-api
python scripts/install_public_models.py
# Verifies SHA-256, installs the model weights and label order.
# The registry is deliberately NOT enabled without licensing approval.

# After reviewing the source, dataset, dependencies and intended use:
python scripts/install_public_models.py --acknowledge-licensing
METLHOLO_MODEL_REGISTRY_PATH=registry.approved.json uvicorn app:app --host 127.0.0.1 --port 8011
```

The script pins the downloaded ONNX SHA-256 and refuses mismatches, places the file in the gitignored model directory, writes a locally approved registry, and leaves `validated_for_botswana: false`. The running server lists this model as ready **only if** the validated bytes and approved registry are present. The model cannot be run inside a static Cloudflare asset; run this service on a Python host. No runtime model download is performed on farmers' devices.

## Register an actual model

1. Examine the source repository, model weights' license, dataset license,
   architecture-specific obligations, and permitted deployment mode. Keep
   attribution and dataset provenance.
2. Obtain a real trained model with known class names and approved weights.
3. For an ONNX classifier, place weights and JSON label array under
   \`services/diagnostics-api/models/\` (gitignored). Record SHA-256 of the
   exact ONNX file. The starter ONNX adapter accepts float32 NCHW models,
   normalized RGB and class-score outputs. Other architectures need an adapter.
4. For a Roboflow model, run \`roboflow/inference\` on your own server.
   For example: install \`inference-cli\` and run
   \`inference server start --port 9001\`. Check whether the specific
   Universe model requires an account/API key and that its weights allow
   your use. Configure METLHOLO_ROBOFLOW_INFERENCE_URL server-side;
   optionally ROBOFLOW_API_KEY in the server environment.
5. Copy \`registry.example.json\` to a private model registry (not automatically
   enabled) and configure \`METLHOLO_MODEL_REGISTRY_PATH\`. Add one entry per
   *actual installed* model, with model/version, source/license record,
   \`license_verified: true\`, and \`validated_for_botswana: false\`
   until an independent evaluation is completed. Never falsely set validation.
6. Test with Botswana field photographs, unknown/healthy classes and
   potential lookalikes before using classifications as guidance.

The service dynamically returns only installed and license-confirmed models
as ready in GET /v1/models; POST /v1/predict and /v1/report require Firebase
bearer ID tokens outside isolated development.

## Model sources being evaluated (not bundled or enabled)

| Candidate | Source | Use |
|---|---|---|
| PlantVillage baseline | https://github.com/spMohanty/PlantVillage-Dataset | Crop-image training data, not a production prediction API |
| PlantDoc field images | https://github.com/pratikkayal/PlantDoc-Dataset | Field-validation data |
| IP102 | https://github.com/xpwu95/IP102 | Pest imagery; review academic-use restriction |
| Lumpy Skin Disease research | https://github.com/aryashah2k/Automatic-Detection-Of-Lumpy-Skin-Disease-Using-Deep-Learning-Techniques | Research only, not a validated livestock diagnostic |
| Roboflow Inference | https://github.com/roboflow/inference | Self-hostable execution engine |
| Roboflow Universe | https://universe.roboflow.com/ | Candidate model discovery; licensing and API access vary |

Do not automatically download or embed third-party model weights from GitHub
or Roboflow without reviewing the model AND its dependencies' licenses. A public
model page does not guarantee unrestricted, commercially reusable weights.

## Safety and reporting contract

- The model returns **AI suggestions**, never a confirmed diagnosis.
- Results include candidate labels, model provenance, calibration/validation
  disclaimers and \`reviewRequired=true\`.
- Scores below the configured threshold yield \`Uncertain\`.
- Generated reports contain no fabricated pesticides, veterinary medications,
  outbreak declarations or government disease advisories.
- Farmer cases are private until an intentional, reviewed sharing workflow exists.
- Official livestock emergency reporting is external to this inference API.
- There is no regional collection API yet, and this service does NOT claim to
  have submitted case reports to authorities.

## Testing

\`\`\`sh
pip install -r requirements-test.txt
pytest -q
\`\`\`

The original \`EXPO_PUBLIC_AI_*_BASE_URL\` endpoints remain unchanged, including
their \`/predict\` and \`/generate-report\` paths. Expo chooses the gateway only
for dynamically discovered, installed gateway models. No existing farm record
or Drive schema is erased.
