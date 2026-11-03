const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "km_token";

export class ApiError extends Error {
  constructor(message, { code = "REQUEST_FAILED", status = 0, details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

async function request(path, options = {}) {
  const { method = "GET", body, formData, headers = {}, signal } = options;
  const token = getToken();
  const requestHeaders = { Accept: "application/json", ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let payload = body;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: payload,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      { code: "NETWORK_ERROR", status: 0 }
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok || data?.success === false) {
    const message =
      data?.message ||
      data?.detail?.message ||
      (typeof data?.detail === "string" ? data.detail : null) ||
      "The request could not be completed.";
    throw new ApiError(message, {
      code: data?.error_code || data?.detail?.error_code || "REQUEST_FAILED",
      status: response.status,
      details: data?.details || data?.detail?.details || null,
    });
  }

  if (data && Object.prototype.hasOwnProperty.call(data, "data")) {
    return data.data;
  }
  return data;
}

export const api = {
  request,
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  health: () => request("/health"),
};
