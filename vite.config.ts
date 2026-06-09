import react from "@vitejs/plugin-react";

import { defineConfig, loadEnv } from "vite";

import { normalizePathPrefix } from "./src/api/querybuilder";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiUrl = env.VITE_REST_API_URL;
  const apiProxyRootPath = normalizePathPrefix(
    env.VITE_REST_API_PROXY_ROOT_PATH,
  );
  const apiVersionPrefix = normalizePathPrefix(
    env.VITE_REST_API_VERSION_PREFIX,
  );
  const apiProxyPrefix = `${apiProxyRootPath}${apiVersionPrefix}`;

  return {
    plugins: [react()],
    base: "./",
    server: {
      proxy: {
        [apiProxyPrefix]: {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) =>
            path.startsWith(apiProxyRootPath)
              ? path.slice(apiProxyRootPath.length) || "/"
              : path,
        },
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
