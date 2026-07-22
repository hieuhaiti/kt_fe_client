import { tokenManager } from "@/lib/tokenManager";
import { emitSessionExpired } from "@/lib/sessionEvents";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL_BE || "")
  .trim()
  .replace(/\/$/, "");
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/google",
  "/auth/google/mobile",
  "/auth/oauth/exchange",
];

let refreshPromise = null;
let authSessionExpired = false;

function buildUrl(endpoint) {
  if (!API_BASE_URL) {
    throw new Error("Thiếu biến môi trường VITE_BASE_URL_BE.");
  }

  return `${API_BASE_URL}/${String(endpoint).replace(/^\//, "")}`;
}

function isPublicAuthRequest(endpoint) {
  const pathname = `/${String(endpoint).replace(/^\//, "").split("?")[0]}`;
  return PUBLIC_AUTH_PATHS.some((path) => pathname === path);
}

function createApiError(response, payload, url) {
  const error = new Error(
    payload?.message || `Yêu cầu thất bại với mã ${response.status}.`,
  );
  error.status = response.status;
  error.data = payload;
  error.url = url;
  return error;
}

async function parseResponse(response) {
  if (response.status === 204) return {};

  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function saveTokens(payload) {
  const data = payload?.data || payload;
  if (!data?.accessToken) return;

  authSessionExpired = false;
  tokenManager.setTokens(
    data.accessToken,
    data.refreshToken || tokenManager.getRefreshToken(),
    data.expiresIn,
    data.refreshExpiresIn,
  );
  tokenManager.setTokenType(data.tokenType || "Bearer");
  tokenManager.setTokenExpiresIn(data.expiresIn);
  tokenManager.setRefreshExpiresIn(data.refreshExpiresIn);
  tokenManager.setLoginTimestamp(Date.now().toString());
}

function markSessionExpired() {
  if (authSessionExpired) return;
  authSessionExpired = true;
  tokenManager.clearTokens();
  emitSessionExpired();
}

async function refreshAccessToken() {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    markSessionExpired();
    throw new Error("NO_REFRESH_TOKEN");
  }

  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/auth/refresh?lang=vi"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const payload = await parseResponse(response);
        if (!response.ok) {
          markSessionExpired();
          throw createApiError(response, payload, response.url);
        }
        saveTokens(payload);
        return payload;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function createRequestOptions(endpoint, options) {
  const { body, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders || {});
  const isFormData = body instanceof FormData;

  if (!isFormData && body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!isPublicAuthRequest(endpoint)) {
    const authorization = tokenManager.getAuthorizationHeader();
    if (authorization) headers.set("Authorization", authorization);
  }

  return {
    ...rest,
    headers,
    body:
      body === undefined || body === null
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  };
}

export async function apiRequest(endpoint, options = {}) {
  const url = buildUrl(endpoint);
  let requestOptions = createRequestOptions(endpoint, options);
  let response;

  try {
    response = await fetch(url, requestOptions);
  } catch (cause) {
    const error = new Error(
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền.",
      { cause },
    );
    error.status = 0;
    throw error;
  }

  if (response.status === 401 && !isPublicAuthRequest(endpoint) && !authSessionExpired) {
    try {
      await refreshAccessToken();
      requestOptions = createRequestOptions(endpoint, options);
      response = await fetch(url, requestOptions);
    } catch (error) {
      markSessionExpired();
      error.status = 401;
      throw error;
    }
  }

  if (response.status === 401 && !isPublicAuthRequest(endpoint)) {
    markSessionExpired();
  }

  const payload = await parseResponse(response);
  if (!response.ok) throw createApiError(response, payload, url);
  return payload;
}

export function withQuery(endpoint, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

export { saveTokens };
