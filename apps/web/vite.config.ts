import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
    react(),
  ],
  optimizeDeps: {
    needsInterop: ["highcharts-react-official", "react-jdenticon"],
  },
  build: {
    outDir: "build",
    sourcemap: true,
    rolldownOptions: {
      checks: {
        eval: false,
      },
    },
  },
});
