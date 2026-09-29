FROM node:20-bookworm-slim

WORKDIR /app

COPY cloudflare/metlholoai-api/model-runtime/package.json ./package.json
RUN npm install --omit=dev

COPY cloudflare/metlholoai-api/model-runtime/server.js ./model-runtime/server.js

COPY services/agricultural-intelligence/apple/models ./models

COPY services/agricultural-intelligence/apple/api/crops/Apple/black_rot/predict.js ./handlers/apple-black-rot-predict.js
COPY services/agricultural-intelligence/apple/api/crops/Apple/black_rot/generate-report.js ./handlers/apple-black-rot-report.js
COPY services/agricultural-intelligence/poultry/api/livestock/poultry/predict.js ./handlers/poultry-predict.js
COPY services/agricultural-intelligence/poultry/api/livestock/poultry/generate-report.js ./handlers/poultry-report.js

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "model-runtime/server.js"]
