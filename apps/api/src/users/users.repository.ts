import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import { buildSetClause } from '../database/set-clause.js';
import type { UserRole, UserStatus } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
  token_version: number;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** An account as the admin sees it. The password hash never leaves this file except via Credentials. */
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** What AdminAuthGuard checks on every request. */
export interface AuthState extends User {
  tokenVersion: number;
}

/** For sign-in and password changes only. */
export interface Credentials extends AuthState {
  passwordHash: string;
}

const USER_COLUMNS = `id, full_name, email, role, status, must_change_password, token_version, last_login_at,
         created_at, updated_at`;

// Admins first, then by name.
const LIST_USERS = `
  SELECT ${USER_COLUMNS}
  FROM users
  ORDER BY role, full_name, created_at`;

const FIND_USER = `
  SELECT ${USER_COLUMNS}
  FROM users
  WHERE id = $1`;

const FIND_CREDENTIALS_BY_EMAIL = `
  SELECT ${USER_COLUMNS}, password_hash
  FROM users
  WHERE email = $1`;

const FIND_CREDENTIALS_BY_ID = `
  SELECT ${USER_COLUMNS}, password_hash
  FROM users
  WHERE id = $1`;

const INSERT_USER = `
  INSERT INTO users (full_name, email, role, password_hash)
  VALUES ($1, $2, $3, $4)
  RETURNING id`;

// Serializes every change that could leave the system without an active admin.
const LOCK_ADMINS = `SELECT pg_advisory_xact_lock(hashtext('users:admins'))`;

const LOCK_USER = `
  SELECT role, status
  FROM users
  WHERE id = $1
  FOR UPDATE`;

const COUNT_OTHER_ACTIVE_ADMINS = `
  SELECT count(*)::int AS count
  FROM users
  WHERE role = 'admin' AND status = 'active' AND id <> $1`;

// A new password always ends the user's other sessions (token_version + 1).
const SET_PASSWORD = `
  UPDATE users
  SET password_hash = $2, must_change_password = $3, token_version = token_version + 1
  WHERE id = $1
  RETURNING token_version`;

const RECORD_LOGIN = `
  UPDATE users
  SET last_login_at = now()
  WHERE id = $1`;

// Code-side whitelist for PATCH (design doc 7.1): only these columns can appear in SET.
const UPDATABLE_COLUMNS: { [K in keyof UpdateUserDto]-?: string } = {
  fullName: 'full_name',
  email: 'email',
  role: 'role',
  status: 'status',
};

function toAuthState(row: UserRow): AuthState {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    mustChangePassword: row.must_change_password,
    tokenVersion: row.token_version,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUser(row: UserRow): User {
  const { tokenVersion: _, ...user } = toAuthState(row);
  return user;
}

const toCredentials = (row: UserRow & { password_hash: string }): Credentials => ({
  ...toAuthState(row),
  passwordHash: row.password_hash,
});

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<User[]> {
    const { rows } = await this.db.query<UserRow>(LIST_USERS);
    return rows.map(toUser);
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.db.query<UserRow>(FIND_USER, [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findAuthState(id: string): Promise<AuthState | null> {
    const { rows } = await this.db.query<UserRow>(FIND_USER, [id]);
    return rows[0] ? toAuthState(rows[0]) : null;
  }

  /** `email` must already be trimmed and lowercased. */
  async findCredentialsByEmail(email: string): Promise<Credentials | null> {
    const { rows } = await this.db.query<UserRow & { password_hash: string }>(FIND_CREDENTIALS_BY_EMAIL, [email]);
    return rows[0] ? toCredentials(rows[0]) : null;
  }

  async findCredentialsById(id: string): Promise<Credentials | null> {
    const { rows } = await this.db.query<UserRow & { password_hash: string }>(FIND_CREDENTIALS_BY_ID, [id]);
    return rows[0] ? toCredentials(rows[0]) : null;
  }

  async insert(
    q: Queryable,
    user: { fullName: string; email: string; role: UserRole; passwordHash: string },
  ): Promise<string> {
    const { rows } = await q.query<{ id: string }>(INSERT_USER, [
      user.fullName,
      user.email,
      user.role,
      user.passwordHash,
    ]);
    return rows[0].id;
  }

  /** Waits for, then holds until the transaction ends, the lock on admin role and status changes. */
  async lockAdmins(q: Queryable): Promise<void> {
    await q.query(LOCK_ADMINS);
  }

  /** Locks the user's row for the rest of the transaction; null when it doesn't exist. */
  async lockUser(q: Queryable, id: string): Promise<{ role: UserRole; status: UserStatus } | null> {
    const { rows } = await q.query<{ role: UserRole; status: UserStatus }>(LOCK_USER, [id]);
    return rows[0] ?? null;
  }

  async countOtherActiveAdmins(q: Queryable, id: string): Promise<number> {
    const { rows } = await q.query<{ count: number }>(COUNT_OTHER_ACTIVE_ADMINS, [id]);
    return rows[0].count;
  }

  /**
   * `patch` must set at least one column. `endSessions` also increases token_version, which signs
   * the user out everywhere. Returns false when no user has this id.
   */
  async update(q: Queryable, id: string, patch: UpdateUserDto, endSessions: boolean): Promise<boolean> {
    const set = buildSetClause(patch, UPDATABLE_COLUMNS);
    const assignments = endSessions ? `${set.sql}, token_version = token_version + 1` : set.sql;
    const { rowCount } = await q.query(
      `UPDATE users SET ${assignments} WHERE id = $${set.values.length + 1}`,
      [...set.values, id],
    );
    return rowCount === 1;
  }

  /** Stores a new password hash and ends all sessions. Returns the new token version, or null if not found. */
  async setPassword(id: string, passwordHash: string, mustChange: boolean): Promise<number | null> {
    const { rows } = await this.db.query<{ token_version: number }>(SET_PASSWORD, [id, passwordHash, mustChange]);
    return rows[0]?.token_version ?? null;
  }

  async recordLogin(id: string): Promise<void> {
    await this.db.query(RECORD_LOGIN, [id]);
  }
}
