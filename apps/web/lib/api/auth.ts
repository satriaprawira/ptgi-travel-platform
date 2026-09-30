import { apiRequest } from "./client";
import { clearToken, setToken } from "./token";

// Demo admin login (apps/api/src/auth). The real auth provider (Auth.js or Clerk) will replace this
// module with its own session handling.

export interface Session {
  email: string;
  role: "admin";
  /** true when the API runs with AUTH_DISABLED (local development): no sign-in needed. */
  authDisabled: boolean;
}

export async function login(email: string, password: string): Promise<void> {
  const result = await apiRequest<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!setToken(result.accessToken)) {
    throw new Error("Your browser blocked sign-in storage. Allow site data for this site and try again.");
  }
}

export const logout = () => clearToken();

/** The signed-in admin; rejects with ApiError status 401 when not signed in. */
export const getSession = () => apiRequest<Session>("/auth/me");
