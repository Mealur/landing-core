import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendUrl =
    process.env.VITE_BACKEND_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:8000";

export default defineConfig({
    plugins: [react()],
    define: {
        "import.meta.env.VITE_BACKEND_URL": JSON.stringify(backendUrl),
    },
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