"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal, PanelHead, TableMessage, badgeClass } from "./ui";
import type { BadgeVariant } from "@/lib/adminData";
import type { Role } from "@/lib/api/auth";
import {
  createUser,
  listUsers,
  resetPassword,
  updateUser,
  type AdminUser,
  type UserChanges,
  type UserStatus,
  type UserWithTemporaryPassword,
} from "@/lib/api/users";

const ROLE: Record<Role, { label: string; variant: BadgeVariant; hint: string }> = {
  admin: { label: "Admin", variant: "indigo", hint: "Everything, including prices and User Management." },
  staff: {
    label: "Staff",
    variant: "muted",
    hint: "Bookings, availability, drivers and vehicles. Can view prices but not change them.",
  },
};

const STATUS: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "success" },
  disabled: { label: "Disabled", variant: "muted" },
};

interface FormState {
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
}

const EMPTY_FORM: FormState = { fullName: "", email: "", role: "staff", status: "active" };

const formFrom = (user: AdminUser): FormState => ({
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  status: user.status,
});

const signInTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tokyo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  title: string;
  description: string;
  showToast: (message: string) => void;
  /** The signed-in admin (null in local development without sign-in): can't lock themselves out. */
  currentUserId: string | null;
}

export default function UserManagement({ title, description, showToast, currentUserId }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // null = modal closed; { editing: null } = adding; { editing: user } = editing that user.
  const [modal, setModal] = useState<{ editing: AdminUser | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // The one time a temporary password is shown, after creating an account or resetting it.
  const [issued, setIssued] = useState<UserWithTemporaryPassword | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setUsers(await listUsers());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openModal = (user: AdminUser | null) => {
    setForm(user ? formFrom(user) : EMPTY_FORM);
    setFormError(null);
    setModal({ editing: user });
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const showPassword = (result: UserWithTemporaryPassword) => {
    setCopied(false);
    setIssued(result);
  };

  const save = async () => {
    if (!modal) return;
    setSaving(true);
    setFormError(null);
    try {
      if (modal.editing) {
        // Send only what changed.
        const original = formFrom(modal.editing);
        const changes = Object.fromEntries(
          Object.entries(form).filter(([key, value]) => original[key as keyof FormState] !== value),
        ) as UserChanges;
        if (Object.keys(changes).length > 0) {
          await updateUser(modal.editing.id, changes);
          showToast(`${form.fullName} updated`);
        }
        setModal(null);
      } else {
        const result = await createUser({ fullName: form.fullName, email: form.email, role: form.role });
        setModal(null);
        showPassword(result);
      }
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const reset = async (user: AdminUser) => {
    const question =
      `Reset the password of ${user.fullName}?\n\n` +
      "They are signed out everywhere and need the new temporary password to sign in.";
    if (!window.confirm(question)) return;
    setBusyId(user.id);
    try {
      showPassword(await resetPassword(user.id));
      await load();
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.temporaryPassword);
      setCopied(true);
    } catch {
      showToast("Couldn't copy: select the password and copy it yourself");
    }
  };

  const editingSelf = modal?.editing !== null && modal?.editing?.id === currentUserId;

  return (
    <>
      <PanelHead
        title={title}
        description={description}
        action={
          <button className={styles.btnPrimary} onClick={() => openModal(null)} disabled={loading || !!loadError}>
            + Add User
          </button>
        }
      />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load users: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last sign-in</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <TableMessage colSpan={6}>Loading users…</TableMessage>
            ) : users.length === 0 ? (
              <TableMessage colSpan={6}>{loadError ? "—" : "No users yet."}</TableMessage>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.fullName}
                    {user.id === currentUserId && <span className={styles.cellSub}>You</span>}
                  </td>
                  <td className={styles.mono}>{user.email}</td>
                  <td>
                    <span className={badgeClass(ROLE[user.role].variant)}>{ROLE[user.role].label}</span>
                  </td>
                  <td>
                    <span className={badgeClass(STATUS[user.status].variant)}>{STATUS[user.status].label}</span>
                    {user.mustChangePassword && user.status === "active" && (
                      <span className={styles.cellSub}>Hasn&apos;t set a password yet</span>
                    )}
                  </td>
                  <td>{user.lastLoginAt ? signInTime.format(new Date(user.lastLoginAt)) : "Never"}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} onClick={() => openModal(user)}>
                        Edit
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          className={styles.iconBtn}
                          onClick={() => void reset(user)}
                          disabled={busyId === user.id}
                        >
                          {busyId === user.id ? "Resetting…" : "Reset password"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className={styles.offeredNote}>
        <strong>New accounts get a temporary password, shown once.</strong>
        <span>
          Give it to the person privately; they choose their own at first sign-in. Accounts are disabled rather than
          deleted, and a disabled user is signed out right away.
        </span>
      </p>

      <FormModal
        open={modal !== null}
        title={modal?.editing ? "Edit User" : "Add User"}
        error={formError}
        saving={saving}
        onClose={() => setModal(null)}
        onSubmit={() => void save()}
      >
        <div className={styles.field}>
          <label htmlFor="user-name">Full name</label>
          <input
            id="user-name"
            required
            maxLength={100}
            placeholder="e.g. Dewi Anggraini"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="user-email">Email</label>
          <input
            id="user-email"
            type="email"
            required
            maxLength={200}
            placeholder="name@example.com"
            autoComplete="off"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              value={form.role}
              disabled={editingSelf}
              onChange={(e) => set("role", e.target.value as Role)}
            >
              {(Object.keys(ROLE) as Role[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE[role].label}
                </option>
              ))}
            </select>
          </div>
          {modal?.editing && (
            <div className={styles.field}>
              <label htmlFor="user-status">Status</label>
              <select
                id="user-status"
                value={form.status}
                disabled={editingSelf}
                onChange={(e) => set("status", e.target.value as UserStatus)}
              >
                {(Object.keys(STATUS) as UserStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS[status].label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <p className={styles.fieldHint}>
          {editingSelf ? "You can't change your own role or status; another admin can." : ROLE[form.role].hint}
        </p>
      </FormModal>

      <div className={`${styles.modalOverlay} ${issued ? styles.modalOverlayShow : ""}`}>
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="temp-password-title">
          <div className={styles.modalHead}>
            <h3 id="temp-password-title">Temporary password for {issued?.user.fullName}</h3>
            <button className={styles.modalClose} onClick={() => setIssued(null)} aria-label="Close">
              &times;
            </button>
          </div>
          <p className={styles.tempPasswordIntro}>
            Sign-in email: <span className={styles.mono}>{issued?.user.email}</span>
          </p>
          <div className={styles.tempPassword}>
            <code>{issued?.temporaryPassword}</code>
            <button className={styles.btnSecondary} onClick={() => void copy()}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className={styles.fieldHint}>
            This is the only time it is shown. Give it to {issued?.user.fullName} privately; they&apos;ll choose their
            own password when they first sign in.
          </p>
          <div className={styles.modalFoot}>
            <button className={styles.btnPrimary} onClick={() => setIssued(null)}>
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
