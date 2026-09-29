import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });

const MODEL_ROUTES = {
  "apple-black-rot": {
    predict: "/predict/apple-black-rot",
    report: "/report/apple-black-rot",
  },
  poultry: {
    predict: "/predict/poultry",
    report: "/report/poultry",
  },
};

export class MetlholoAIModelRuntime extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
  enableInternet = true;
  envVars = {
    NODE_ENV: "production",
    GEMINI_API_KEY: env.GEMINI_API_KEY || "",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type,authorization",
        },
      });
    }

    if (url.pathname === "/health") {
      return json({
        success: true,
        service: "metlholoai-api",
        environment: env.ENVIRONMENT || "unknown",
        status: "gateway_ready",
        modelRuntime: "cloudflare_container",
        connectedModels: Object.keys(MODEL_ROUTES),
      });
    }

    if (url.pathname === "/runtime-health") {
      const targetUrl = new URL(request.url);
      targetUrl.pathname = "/ready";
      targetUrl.search = "";
      return getContainer(
        env.MODEL_RUNTIME,
        "metlholoai-shared"
      ).fetch(new Request(targetUrl.toString(), request));
    }

    if (url.pathname === "/predict" || url.pathname === "/report") {
      const model =
        url.searchParams.get("model") ||
        url.searchParams.get("service");

      const route = MODEL_ROUTES[model];

      if (!route) {
        return json({
          success: false,
          error: "MODEL_NOT_CONFIGURED",
          availableModels: Object.keys(MODEL_ROUTES),
        }, 400);
      }

      if (url.pathname === "/report" && request.method !== "POST") {
        return json({ success: false, error: "METHOD_NOT_ALLOWED" }, 405);
      }

      if (url.pathname === "/predict" && request.method !== "POST") {
        return json({ success: false, error: "METHOD_NOT_ALLOWED" }, 405);
      }

      const targetPath =
        url.pathname === "/predict" ? route.predict : route.report;

      const targetUrl = new URL(request.url);
      targetUrl.pathname = targetPath;
      targetUrl.search = "";

      const forwarded = new Request(targetUrl.toString(), request);
      return getContainer(env.MODEL_RUNTIME, "metlholoai-shared").fetch(forwarded);
    }

    return json({ success: false, error: "NOT_FOUND" }, 404);
  },
};
