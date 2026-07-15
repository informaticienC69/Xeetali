import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Le proxy dev évite tout problème CORS : /api est relayé vers le backend FastAPI.
// Cible surchargeable via VITE_API_PROXY_TARGET (docker-compose.yml la fixe à
// http://backend:8000 pour le conteneur dev — le nom de service Docker n'est
// pas résoluble depuis l'hôte). Sans cette variable (dev local hors Docker),
// comportement inchangé : proxy vers 127.0.0.1:8002.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8002",
        changeOrigin: true,
      },
    },
  },
});
