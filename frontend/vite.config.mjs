import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    base: "./",
    plugins: [react()],
    // Support both Vite-style and legacy CRA-style frontend env vars.
    envPrefix: ["VITE_", "REACT_APP_"],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 3000,
    },
});