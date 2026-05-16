const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

function clearStorage(storage) {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

function detectStorage() {
  if (localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)) {
    return localStorage;
  }

  if (sessionStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
    return sessionStorage;
  }

  return null;
}

export function readAuthFromStorage() {
  const storage = detectStorage();

  if (!storage) {
    return { access: null, refresh: null, user: null, storage: null };
  }

  try {
    const access = storage.getItem(ACCESS_TOKEN_KEY);
    const refresh = storage.getItem(REFRESH_TOKEN_KEY);
    const rawUser = storage.getItem(USER_KEY);

    return {
      access,
      refresh,
      user: rawUser ? JSON.parse(rawUser) : null,
      storage,
    };
  } catch {
    clearAuth();
    return { access: null, refresh: null, user: null, storage: null };
  }
}

export function persistAuth(access, refresh, user, rememberMe = false) {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  clearStorage(otherStorage);

  targetStorage.setItem(ACCESS_TOKEN_KEY, access);
  targetStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  targetStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateStoredTokens(access, refresh) {
  const { storage } = readAuthFromStorage();
  const targetStorage = storage || localStorage;

  if (access) {
    targetStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  if (refresh) {
    targetStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export function updateStoredUser(user) {
  const { storage } = readAuthFromStorage();
  const targetStorage = storage || localStorage;

  if (user) {
    targetStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getStoredAccessToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getStoredRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

export function clearAuth() {
  clearStorage(localStorage);
  clearStorage(sessionStorage);
}
