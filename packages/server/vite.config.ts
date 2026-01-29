import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "node20",
    rollupOptions: {
      external: [
        "@search-server/sdk",
        "@hono/node-server",
        "@hono/zod-validator",
        "chromadb",
        "hono",
        "hono/cors",
        "hono/logger",
        "hono/http-exception",
        /^node:.*/,
      ],
    },
  },
  plugins: [
    dts({
      include: ["src/**/*"],
      outDir: "dist",
    }),
  ],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/services/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
