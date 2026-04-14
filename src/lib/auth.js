const TOKEN_KEY = "authToken";
const USER_ID_KEY = "userId";
const IS_ADMIN_KEY = "isAdmin";
const EXPIRATION_KEY = "tokenExpiration";
const USER_NAME_KEY = "userName";
const DEPT_ID_KEY = "departmentId";
const DEPT_NAME_KEY = "departmentName";

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const decodeTokenPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
};

export const getStoredUserId = () => {
  const stored = Number(localStorage.getItem(USER_ID_KEY));
  if (stored) return stored;
  const token = getAuthToken();
  const payload = decodeTokenPayload(token);
  const tokenUserId = Number(payload?.UserId ?? payload?.userId);
  return tokenUserId || 0;
};

export const getStoredUserName = () => {
  const stored = localStorage.getItem(USER_NAME_KEY);
  if (stored) return stored;
  const token = getAuthToken();
  const payload = decodeTokenPayload(token);
  return payload?.UserName || payload?.userName || "";
};

export const getStoredDepartmentId = () => {
  const stored = Number(localStorage.getItem(DEPT_ID_KEY));
  if (stored) return stored;
  const token = getAuthToken();
  const payload = decodeTokenPayload(token);
  return Number(payload?.DepartmentID ?? payload?.departmentId) || 0;
};

export const getStoredDepartmentName = () =>
  localStorage.getItem(DEPT_NAME_KEY) || "";

export const saveAuth = ({ token, expiration, userId, isAdmin }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (expiration) localStorage.setItem(EXPIRATION_KEY, String(expiration));
  if (userId !== undefined && userId !== null) {
    const resolved = Number(userId);
    if (resolved) {
      localStorage.setItem(USER_ID_KEY, String(resolved));
    }
  }
  if (isAdmin !== undefined) localStorage.setItem(IS_ADMIN_KEY, String(isAdmin));
  window.dispatchEvent(new Event("auth:changed"));
  window.dispatchEvent(new Event("reimb:refreshCounts"));
};

export const saveUserMeta = ({ userName, departmentId, departmentName }) => {
  if (userName) localStorage.setItem(USER_NAME_KEY, String(userName));
  if (departmentId) localStorage.setItem(DEPT_ID_KEY, String(departmentId));
  if (departmentName) localStorage.setItem(DEPT_NAME_KEY, String(departmentName));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(IS_ADMIN_KEY);
  localStorage.removeItem(EXPIRATION_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(DEPT_ID_KEY);
  localStorage.removeItem(DEPT_NAME_KEY);
  window.dispatchEvent(new Event("auth:changed"));
  window.dispatchEvent(new Event("reimb:refreshCounts"));
};

export const isAuthenticated = () => Boolean(getAuthToken());

export const logout = () => {
  clearAuth();
  window.location.href = "/login";
};
