import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from a sub-path; CI sets DEPLOY_BASE=/MyNotion/.
  base: process.env.DEPLOY_BASE ?? "/",
});
