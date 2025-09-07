import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: '/app/',
    build: {
        outDir: '../react-build',
        emptyOutDir: true
    },
    plugins: [react()]
});