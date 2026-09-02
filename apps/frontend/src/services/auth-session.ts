import { TOKEN_KEY } from "@/config";

export const TOKEN_CHANGED_EVENT = "linkdo:token-changed";

let expirationTimer: ReturnType<typeof setTimeout> | undefined;

export function getTokenExpiration(token: string): number | null {
  const jwt = token.split("|", 1)[0];
  const payload = jwt?.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
    );
    const { exp } = JSON.parse(decoded) as { exp?: unknown };

    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function scheduleTokenExpiration(
  token: string | null,
  onExpired: () => void,
): () => void {
  if (expirationTimer) {
    clearTimeout(expirationTimer);
    expirationTimer = undefined;
  }

  const expiration = token ? getTokenExpiration(token) : null;
  if (!expiration) {
    return () => undefined;
  }

  const delay = expiration - Date.now();
  if (delay <= 0) {
    onExpired();
    return () => undefined;
  }

  expirationTimer = setTimeout(onExpired, delay);
  return () => {
    if (expirationTimer) {
      clearTimeout(expirationTimer);
      expirationTimer = undefined;
    }
  };
}

function notifyTokenChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT));
  }
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  notifyTokenChange();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  notifyTokenChange();
}

export function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}
