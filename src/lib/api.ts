// ฝั่งเบราว์เซอร์: เรียก API ของแอป (ข้อมูลทั้งหมดอยู่ใน Supabase ผ่านเซิร์ฟเวอร์)
import type { Messages } from "@/lib/i18n";
import type { Transaction, TransactionInput } from "@/lib/transactions";

export type Role = "admin" | "user";
export type SessionUser = { id: string; username: string; displayName: string; role: Role };
export type AppUser = { id: string; username: string; displayName: string; role: Role; isActive: boolean; createdAt: string };

export class ApiError extends Error {
  constructor(public code: string, public status: number, public body: Record<string, unknown> = {}) {
    super(code);
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  } catch {
    throw new ApiError("network", 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(typeof data.error === "string" ? data.error : "server", response.status, data);
  return data as T;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  me: () => request<{ user: SessionUser }>("/api/auth/me"),
  login: (username: string, password: string) => request("/api/auth/login", { method: "POST", body: json({ username, password }) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  setup: (input: { username: string; displayName: string; password: string }) => request("/api/setup", { method: "POST", body: json(input) }),

  listTransactions: (userId?: string) =>
    request<{ transactions: Transaction[] }>(`/api/transactions${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`).then((r) => r.transactions),
  createTransactions: (items: TransactionInput[]) =>
    request<{ transactions: Transaction[] }>("/api/transactions", { method: "POST", body: json({ items }) }).then((r) => r.transactions),
  updateTransaction: (id: string, item: TransactionInput) =>
    request<{ transaction: Transaction }>(`/api/transactions/${id}`, { method: "PATCH", body: json({ item }) }).then((r) => r.transaction),
  deleteTransaction: (id: string) => request(`/api/transactions/${id}`, { method: "DELETE" }),
  importTransactions: (items: TransactionInput[]) =>
    request<{ imported: number; skipped: number }>("/api/transactions/import", { method: "POST", body: json({ items }) }),

  listUsers: () => request<{ users: AppUser[] }>("/api/users").then((r) => r.users),
  createUser: (input: { username: string; displayName: string; password: string; role: Role }) =>
    request<{ user: AppUser }>("/api/users", { method: "POST", body: json(input) }).then((r) => r.user),
  updateUser: (id: string, patch: Partial<{ displayName: string; role: Role; isActive: boolean; password: string }>) =>
    request<{ user: AppUser }>(`/api/users/${id}`, { method: "PATCH", body: json(patch) }).then((r) => r.user),
};

// รหัส error จาก API → ข้อความในหน้าจอ
const ERROR_MESSAGE: Record<string, keyof Messages> = {
  bad_login: "errBadLogin",
  disabled: "errDisabled",
  bad_username: "errBadUsername",
  bad_name: "errBadName",
  weak_password: "errWeakPassword",
  username_taken: "errUsernameTaken",
  self_lockout: "errSelfLockout",
  no_db: "errNoDb",
  unauthorized: "errUnauthorized",
  forbidden: "errForbidden",
  invalid: "errInvalid",
  not_found: "errNotFound",
  network: "errNetwork",
};

export function errorText(t: Messages, err: unknown) {
  const code = err instanceof ApiError ? err.code : "server";
  return t[ERROR_MESSAGE[code] ?? "errServer"];
}
