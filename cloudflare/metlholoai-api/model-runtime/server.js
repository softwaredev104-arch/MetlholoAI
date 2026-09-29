const express = require("express");

const appleBlackRotPredict = require("/app/handlers/apple-black-rot-predict");
const appleBlackRotReport = require("/app/handlers/apple-black-rot-report");
const poultryPredict = require("/app/handlers/poultry-predict");
const poultryReport = require("/app/handlers/poultry-report");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

app.get("/ready", (_req, res) => {
  res.json({
    success: true,
    service: "metlholoai-model-runtime",
    status: "ready",
    models: ["apple-black-rot", "poultry"],
  });
});

app.post("/predict/apple-black-rot", appleBlackRotPredict);
app.post("/report/apple-black-rot", appleBlackRotReport);
app.post("/predict/poultry", poultryPredict);
app.post("/report/poultry", poultryReport);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "MODEL_ROUTE_NOT_FOUND" });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => {
  console.log(`MetlholoAI model runtime listening on ${port}`);
});
