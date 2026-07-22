const TOKEN_KEY = "store_inventory_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getTokenExpiry(token: string) {
  try {
    const payload = JSON.parse(window.atob(token.split(".")[1])) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const expiry = getTokenExpiry(token);
  return expiry ? Date.now() >= expiry : false;
}
