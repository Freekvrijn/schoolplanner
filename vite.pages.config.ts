// Static build for GitHub Pages: plain React + Vite, served under /schoolplanner/.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: r("./web"),
  base: "/schoolplanner/",
  publicDir: r("./public"),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": r("./src") } },
  build: { outDir: r("./dist-pages"), emptyOutDir: true },
});

