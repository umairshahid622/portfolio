import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("node_modules/three/")) {
              return "three-core";
            }
            if (
              id.includes("@react-three") ||
              id.includes("three-stdlib") ||
              id.includes("three-mesh-bvh") ||
              id.includes("troika") ||
              id.includes("@mediapipe")
            ) {
              return "three-addons";
            }
            if (id.includes("gsap") || id.includes("lenis") || id.includes("motion")) {
              return "vendor-animation";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            return "vendor-libs";
          }
        },
      },
    },
  },
});
