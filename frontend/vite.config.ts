import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Le proxy dev évite tout problème CORS : /api est relayé vers le backend FastAPI.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8002",
        changeOrigin: true,
      },
    },
  },
});
