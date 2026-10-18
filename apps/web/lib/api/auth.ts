import { apiRequest } from "./client";
import { clearToken, setToken } from "./token";

// Staff sign-in (apps/api/src/auth). Accounts are managed in User Management; customers don't sign in.

export type Role = "admin" | "staff";

export interface Session {
  /** null when the API runs with AUTH_DISABLED (local development): nobody is signed in. */
  id: string | null;
  fullName: string;
  email: string;
  role: Role;
  /** Signed in with a temporary password: only changing it is allowed until then. */
  mustChangePassword: boolean;
  /** true when the API runs with AUTH_DISABLED (local development): no sign-in needed. */
  authDisabled: boolean;
}

interface SignInResult {
  accessToken: string;
  user: Session;
}

const BLOCKED_STORAGE = "Your browser blocked sign-in storage. Allow site data for this site and try again.";

export async function login(email: string, password: string): Promise<Session> {
  const result = await apiRequest<SignInResult>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!setToken(result.accessToken)) throw new Error(BLOCKED_STORAGE);
  return result.user;
}

export const logout = () => clearToken();

/** The signed-in user; rejects with ApiError status 401 when not signed in. */
export const getSession = () => apiRequest<Session>("/auth/me");

export const PASSWORD_MIN_LENGTH = 12;

/** Checked before sending, so the common mistakes get a message right away. */
export function newPasswordProblem(newPassword: string, repeated: string): string | null {
  if (newPassword.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (newPassword !== repeated) return "The two new passwords don't match.";
  return null;
}

/** Sets the user's own password. Their other sessions end; this one continues with a new token. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<Session> {
  const result = await apiRequest<SignInResult>("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
  if (!setToken(result.accessToken)) throw new Error(BLOCKED_STORAGE);
  return result.user;
}
