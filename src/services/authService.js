import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { saveTokens, withQuery } from "@/services/apiClient/request";
import { useApiMutation, useApiQuery } from "@/services/apiClient/useApi";
import { tokenManager } from "@/lib/tokenManager";

const AUTH_PATH = "/auth";
const languageQuery = (lang = "vi") => ({ lang });

export async function login(payload, lang = "vi") {
  const response = await mutater(
    withQuery(`${AUTH_PATH}/login`, languageQuery(lang)),
    "POST",
    payload,
  );
  saveTokens(response);
  return response;
}

export function register(payload, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/register`, languageQuery(lang)),
    "POST",
    payload,
  );
}

export async function refreshToken(lang = "vi") {
  const response = await mutater(
    withQuery(`${AUTH_PATH}/refresh`, languageQuery(lang)),
    "POST",
    { refreshToken: tokenManager.getRefreshToken() },
  );
  saveTokens(response);
  return response;
}

export function forgotPassword(email, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/forgot-password`, languageQuery(lang)),
    "POST",
    { email },
  );
}

export function resetPassword(payload, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/reset-password`, languageQuery(lang)),
    "POST",
    payload,
  );
}

export function verifyEmail(token, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/verify-email`, languageQuery(lang)),
    "POST",
    { token },
  );
}

export function resendVerification(email, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/resend-verification`, languageQuery(lang)),
    "POST",
    { email },
  );
}

export function getGoogleLoginUrl(lang = "vi") {
  const baseUrl = (import.meta.env.VITE_BASE_URL_BE || "")
    .trim()
    .replace(/\/$/, "");
  return `${baseUrl}${withQuery(`${AUTH_PATH}/google`, languageQuery(lang))}`;
}

export function googleMobileLogin(idToken, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/google/mobile`, languageQuery(lang)),
    "POST",
    { idToken },
  );
}

export async function exchangeOAuthCode(code, lang = "vi") {
  const response = await mutater(
    withQuery(`${AUTH_PATH}/oauth/exchange`, languageQuery(lang)),
    "POST",
    { code },
  );
  saveTokens(response);
  return response;
}

export function getProfile(lang = "vi") {
  return fetcher(withQuery(`${AUTH_PATH}/me`, languageQuery(lang)));
}

export function updateProfile(payload, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/me`, languageQuery(lang)),
    "PATCH",
    payload,
  );
}

export function changePassword(payload, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/change-password`, languageQuery(lang)),
    "POST",
    payload,
  );
}

export function setPassword(newPassword, lang = "vi") {
  return mutater(
    withQuery(`${AUTH_PATH}/set-password`, languageQuery(lang)),
    "POST",
    { newPassword },
  );
}

export async function logout(lang = "vi") {
  try {
    await mutater(
      withQuery(`${AUTH_PATH}/logout`, languageQuery(lang)),
      "POST",
      { refreshToken: tokenManager.getRefreshToken() },
    );
  } finally {
    tokenManager.clearTokens();
  }
}

export function useGetProfileQuery(options = {}) {
  return useApiQuery(
    ["auth", "me"],
    withQuery(`${AUTH_PATH}/me`, languageQuery()),
    options,
  );
}

export function useUpdateProfileMutation(options = {}) {
  return useApiMutation(
    ["auth", "update-profile"],
    withQuery(`${AUTH_PATH}/me`, languageQuery()),
    "PATCH",
    options,
  );
}

export function useChangePasswordMutation(options = {}) {
  return useApiMutation(
    ["auth", "change-password"],
    withQuery(`${AUTH_PATH}/change-password`, languageQuery()),
    "POST",
    options,
  );
}

export const auth = {
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  exchangeOAuthCode,
  getProfile,
  updateProfile,
  changePassword,
  setPassword,
  isAuthenticated: () => Boolean(tokenManager.getAccessToken()),
};
