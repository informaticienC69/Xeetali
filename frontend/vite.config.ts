import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En développement : le proxy Vite relaie /api vers le backend local (évite CORS).
// En production (Vercel) : VITE_API_URL pointe directement vers le backend Render
// (ex: https://xeetali-backend.onrender.com). Plus de proxy nécessaire.
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
