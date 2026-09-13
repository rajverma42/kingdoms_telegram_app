import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Small, dependency-light build — the whole point of a Mini App is a fast
// first paint on mid-range Android phones over mobile data.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    sourcemap: false,
  },
});
