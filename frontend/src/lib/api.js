const backendUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.REACT_APP_BACKEND_URL ||
    "http://localhost:8000";

export const API = `${backendUrl.replace(/\/$/, "")}/api`;