import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Small, dependency-light build — the whole point of a Mini App is a fast
// first paint on mid-range Android phones over mobile data.
//
// `base` only changes for a production build: GitHub Pages serves this repo
// as a project page (https://<user>.github.io/kingdoms_telegram_app/), so
// built asset URLs need that path prefix — but `npm run dev` should still
// serve from "/" so local development isn't forced onto a matching subpath.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/kingdoms_telegram_app/" : "/",
  build: {
    target: "es2020",
    sourcemap: false,
  },
}));
