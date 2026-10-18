import { apiRequest } from "./client";
import type { Role } from "./auth";

// Mirrors apps/api/src/users. Admins only.

export type UserStatus = "active" | "disabled";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Returned once when an account is created or its password reset; the server doesn't keep it. */
export interface UserWithTemporaryPassword {
  user: AdminUser;
  temporaryPassword: string;
}

export interface NewUser {
  fullName: string;
  email: string;
  role: Role;
}

export type UserChanges = Partial<NewUser & { status: UserStatus }>;

export const listUsers = () => apiRequest<AdminUser[]>("/admin/users");

export const createUser = (user: NewUser) =>
  apiRequest<UserWithTemporaryPassword>("/admin/users", { method: "POST", body: user });

export const updateUser = (id: string, changes: UserChanges) =>
  apiRequest<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: changes });

export const resetPassword = (id: string) =>
  apiRequest<UserWithTemporaryPassword>(`/admin/users/${id}/reset-password`, { method: "POST", body: {} });
