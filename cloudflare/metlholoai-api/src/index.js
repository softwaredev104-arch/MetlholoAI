const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

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
      });
    }

    if (url.pathname === "/predict" || url.pathname === "/report") {
      return json({
        success: false,
        error: "MODEL_RUNTIME_NOT_CONNECTED",
        message: "The Cloudflare gateway is deployed separately from the Expo app. Connect the verified agricultural model runtime before enabling prediction/report execution.",
      }, 503);
    }

    return json({ success: false, error: "NOT_FOUND" }, 404);
  },
};
