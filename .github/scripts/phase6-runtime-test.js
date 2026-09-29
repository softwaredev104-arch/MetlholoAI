const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

async function main() {
  const [serviceRoot, predictHandler, reportHandler, imageUrl, subject] = process.argv.slice(2);
  if (!serviceRoot || !predictHandler || !reportHandler || !imageUrl || !subject) {
    throw new Error('Usage: runtime-test <serviceRoot> <predictHandler> <reportHandler> <imageUrl> <subject>');
  }

  const root = path.resolve(serviceRoot);
  const serviceRequire = createRequire(path.join(root, 'package.json'));
  const express = serviceRequire('express');
  const http = require('http');

  process.chdir(root);
  const predict = serviceRequire('./' + predictHandler);
  const report = serviceRequire('./' + reportHandler);

  const app = express();
  app.post('/predict', predict);
  app.use(express.json({ limit: '1mb' }));
  app.post('/report', report);

  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;

  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`image download failed: HTTP ${imageResponse.status}`);
    const image = Buffer.from(await imageResponse.arrayBuffer());

    const form = new FormData();
    form.append('image', new Blob([image], { type: 'image/jpeg' }), 'real-test-image.jpg');

    const predictionResponse = await fetch(`http://127.0.0.1:${port}/predict`, {
      method: 'POST',
      body: form,
    });
    const prediction = await predictionResponse.json();

    if (!predictionResponse.ok || prediction.success === false) {
      throw new Error(`/predict failed: HTTP ${predictionResponse.status} ${JSON.stringify(prediction)}`);
    }

    const confidence = Number(prediction.confidence);
    const disease = String(prediction.disease ?? prediction.prediction ?? prediction.label ?? '').trim();
    if (!disease) throw new Error(`/predict returned no prediction label: ${JSON.stringify(prediction)}`);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
      throw new Error(`/predict returned invalid confidence: ${JSON.stringify(prediction)}`);
    }

    console.log(JSON.stringify({ stage: 'PREDICTION_VERIFIED', subject, disease, confidence, response: prediction }));

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_UNAVAILABLE: GEMINI_API_KEY is not configured in GitHub Actions.');
    }

    const reportResponse = await fetch(`http://127.0.0.1:${port}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        disease,
        confidence,
        country: 'Botswana',
        district: 'Gaborone',
        cropOrAnimal: subject,
      }),
    });
    const reportPayload = await reportResponse.json();

    if (!reportResponse.ok || reportPayload.success !== true) {
      throw new Error(`report failed: HTTP ${reportResponse.status} ${JSON.stringify(reportPayload)}`);
    }

    const structured = reportPayload.structuredReport;
    const required = ['diseaseName','confidenceLevel','overview','severity','immediateActions','treatmentPlan','prevention','economicImpact','monitoringPlan'];
    if (!structured || typeof structured !== 'object') {
      throw new Error('structured report missing');
    }
    for (const key of required) {
      if (typeof structured[key] !== 'string' || !structured[key].trim()) {
        throw new Error(`structured report field missing: ${key}`);
      }
    }
    if (String(structured.diseaseName).trim() !== disease) {
      throw new Error(`prediction/report disease mismatch: prediction=${disease}, report=${structured.diseaseName}`);
    }

    console.log(JSON.stringify({
      stage: 'REPORT_GEMINI_STRUCTURED_VERIFIED',
      subject,
      disease,
      confidence,
      confidenceLevel: structured.confidenceLevel,
      sections: required,
    }));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
