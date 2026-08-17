import netlify from "@netlify/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Assign the loaded .env variables directly to Node's process environment
  process.env = { ...process.env, ...env };

  return {
    plugins: [netlify(), react(), tailwindcss()],
  };
});
