const API_BASE = "https://social-media-app-jjph.onrender.com/api";
const UPLOAD_BASE = "https://social-media-app-jjph.onrender.com";

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    const headers = { ...options.headers };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },
};

function getImageUrl(path) {
  if (!path) return "images/default-avatar.svg";
  if (path.startsWith("http") || path.startsWith("images/")) return path;
  return `${UPLOAD_BASE}${path}`;
}
