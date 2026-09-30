// Where the demo admin login keeps its token (localStorage, for this demo only). Read by client.ts to
// sign admin requests, written by auth.ts at sign-in.

const TOKEN_KEY = "gi.adminToken";

/** Fired on window when a signed-in request is rejected because the session ended. */
export const SESSION_EXPIRED_EVENT = "gi:session-expired";

// localStorage can throw (private windows, blocked storage); treat that as "no session".
export function getToken(): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Returns false when the browser refuses to store it. */
export function setToken(token: string): boolean {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing stored, nothing to clear
  }
}
