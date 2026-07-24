import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

function apiDevMiddleware() {
  return {
    name: "api-dev-middleware",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith("/api/")) return next();

        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", async () => {
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            req.body = {};
          }

          const routePath = req.url.split("?")[0].replace("/api", "");
          const modulePath = path.resolve(process.cwd(), `api${routePath}.js`);

          try {
            const mod = await server.ssrLoadModule(modulePath);
            const handler = mod.default;

            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            };

            await handler(req, res);
          } catch (err) {
            console.error(`[api-dev] ${routePath} failed:`, err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal error" }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevMiddleware()],
  };
});