const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const REFRESH_ID_KEY = "refresh_token_id";
const USER_KEY = "auth_user";

export function saveAuth(accessToken, refreshToken, refreshTokenId, user) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(REFRESH_ID_KEY, refreshTokenId.toString());
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(REFRESH_ID_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getRefreshTokenId() {
  const raw = localStorage.getItem(REFRESH_ID_KEY);
  return raw ? parseInt(raw) : null;
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
