import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",          // critical for Electron file:// in production
  server: { port: 5173, strictPort: true },
  build:  { outDir: "dist", emptyOutDir: true },
});
