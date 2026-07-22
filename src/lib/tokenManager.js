import Cookies from "js-cookie";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const TOKEN_TYPE_KEY = "token_type";
export const TOKEN_EXPIRES_IN_KEY = "token_expires_in";
export const REFRESH_EXPIRES_IN_KEY = "refresh_expires_in";
export const LOGIN_TIMESTAMP_KEY = "login_timestamp";

// Helper function to parse duration strings like "7D", "7d", "30D", "24H" to seconds
function parseDurationToDays(duration) {
  if (!duration) return undefined;
  const match = /^(\d+)([smhd])$/i.exec(duration);
  if (!match) return undefined;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return value / 86400;
    case "m":
      return value / 1440;
    case "h":
      return value / 24;
    case "d":
      return value;
    default:
      return undefined;
  }
}

const IS_HTTPS = window.location.protocol === "https:";

// Cookie options: chỉ bật secure trên HTTPS, tránh bị block trên HTTP ở production
function getCookieOptions(extraOptions = {}) {
  return {
    secure: IS_HTTPS,
    sameSite: "strict",
    ...extraOptions,
  };
}

// Token management utilities
export const tokenManager = {
  // Get accessToken from cookies
  getAccessToken() {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },

  // Set accessToken to cookies
  setAccessToken(token, expiresIn = null) {
    if (token) {
      try {
        const cookieOptions = getCookieOptions();
        if (expiresIn) {
          const expiresDays = parseDurationToDays(expiresIn);
          if (expiresDays) {
            cookieOptions.expires = expiresDays;
          }
        }
        Cookies.set(ACCESS_TOKEN_KEY, token, cookieOptions);
      } catch (error) {
        console.error("[TokenManager] Failed to save accessToken:", error);
      }
    } else {
      Cookies.remove(ACCESS_TOKEN_KEY);
    }
  },

  // Get refreshToken from cookies
  getRefreshToken() {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },

  // Set refreshToken to cookies
  setRefreshToken(token, expiresIn = null) {
    if (token) {
      try {
        const cookieOptions = getCookieOptions();
        if (expiresIn) {
          const expiresDays = parseDurationToDays(expiresIn);
          if (expiresDays) {
            cookieOptions.expires = expiresDays;
          }
        }
        Cookies.set(REFRESH_TOKEN_KEY, token, cookieOptions);
      } catch (error) {
        console.error("[TokenManager] Failed to save refreshToken:", error);
      }
    } else {
      Cookies.remove(REFRESH_TOKEN_KEY);
    }
  },

  // Get token type (usually "Bearer")
  getTokenType() {
    return Cookies.get(TOKEN_TYPE_KEY) || "Bearer";
  },

  // Set token type
  setTokenType(type) {
    if (type) {
      Cookies.set(TOKEN_TYPE_KEY, type, getCookieOptions());
    } else {
      Cookies.remove(TOKEN_TYPE_KEY);
    }
  },

  // Get token expiration info
  getTokenExpiresIn() {
    return Cookies.get(TOKEN_EXPIRES_IN_KEY);
  },

  // Set token expiration info
  setTokenExpiresIn(expiresIn) {
    if (expiresIn) {
      Cookies.set(TOKEN_EXPIRES_IN_KEY, expiresIn, getCookieOptions());
    } else {
      Cookies.remove(TOKEN_EXPIRES_IN_KEY);
    }
  },

  // Get refresh token expiration info
  getRefreshExpiresIn() {
    return Cookies.get(REFRESH_EXPIRES_IN_KEY);
  },

  // Set refresh token expiration info
  setRefreshExpiresIn(expiresIn) {
    if (expiresIn) {
      Cookies.set(REFRESH_EXPIRES_IN_KEY, expiresIn, getCookieOptions());
    } else {
      Cookies.remove(REFRESH_EXPIRES_IN_KEY);
    }
  },

  // Get login timestamp
  getLoginTimestamp() {
    return Cookies.get(LOGIN_TIMESTAMP_KEY);
  },

  // Set login timestamp
  setLoginTimestamp(timestamp) {
    if (timestamp) {
      Cookies.set(LOGIN_TIMESTAMP_KEY, timestamp, getCookieOptions());
    } else {
      Cookies.remove(LOGIN_TIMESTAMP_KEY);
    }
  },

  // Clear all tokens and related data
  clearTokens() {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(TOKEN_TYPE_KEY);
    Cookies.remove(TOKEN_EXPIRES_IN_KEY);
    Cookies.remove(REFRESH_EXPIRES_IN_KEY);
    Cookies.remove(LOGIN_TIMESTAMP_KEY);
  },

  // Check if user has valid tokens
  hasTokens() {
    return !!(this.getAccessToken() && this.getRefreshToken());
  },

  // Store both tokens (usually after login)
  setTokens(
    accessToken,
    refreshToken,
    accessExpiresIn = null,
    refreshExpiresIn = null,
  ) {
    this.setAccessToken(accessToken, accessExpiresIn);
    this.setRefreshToken(refreshToken, refreshExpiresIn);
  },

  // Get full authorization header value
  getAuthorizationHeader() {
    const accessToken = this.getAccessToken();
    const tokenType = this.getTokenType();
    return accessToken ? `${tokenType} ${accessToken}` : null;
  },

  // Get all token information as an object
  getTokenInfo() {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
      tokenType: this.getTokenType(),
      expiresIn: this.getTokenExpiresIn(),
      refreshExpiresIn: this.getRefreshExpiresIn(),
      loginTimestamp: this.getLoginTimestamp(),
      isAuthenticated: this.hasTokens(),
    };
  },
};
