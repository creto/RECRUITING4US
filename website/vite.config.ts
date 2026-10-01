import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The website is an independent package inside the RECRUIT4US repo. It never
// imports from ../src (the hiring app). three / R3F / drei live behind dynamic
// imports (src/three/Stage.tsx, src/three/ViewSlot.tsx), so the first paint
// ships only React, GSAP, Lenis and the page itself.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { host: "0.0.0.0", port: 5190, strictPort: true },
  preview: { host: "0.0.0.0", port: 5191, strictPort: true },
  build: {
    target: "es2022",
    cssTarget: "chrome111",
    chunkSizeWarningLimit: 1000,
  },
});
