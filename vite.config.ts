import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from https://<user>.github.io/MyNotion/ on GitHub Pages
  base: "/MyNotion/",
  plugins: [react()],
});
