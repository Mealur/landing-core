const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const API = `${backendUrl.replace(/\/$/, "")}/api`;