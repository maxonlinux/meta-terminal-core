import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import "dotenv/config";

const core_url = process.env.CORE_URL;
if (!core_url) throw new Error("CORE_URL is not defined");

export default defineConfig({
  middleware: "src/middleware/index.ts",
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: core_url,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ""),
        },
      },
    },
  },
});
