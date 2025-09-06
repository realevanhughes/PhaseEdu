import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: '/react/',
    build: {
        outDir: '../react-build',
        emptyOutDir: true
    },
    plugins: [react()]
});