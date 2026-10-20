"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, errorText, type AppUser, type Role } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

// หน้าจัดการผู้ใช้ (admin เท่านั้น): สร้างผู้ใช้ เปลี่ยนบทบาท ปิด/เปิดใช้งาน รีเซ็ตรหัสผ่าน
// ถ้าไม่ใช่ admin: AppShell พากลับหน้าแรก และ API ก็ตอบ 403 อยู่แล้ว
export default function UsersPage() {
  const { t } = useI18n();
  const { user } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user?.role === "admin") api.listUsers().then(setUsers).catch((err) => setMessage({ ok: false, text: errorText(t, err) }));
  }, [user?.role, t]);

  if (user?.role !== "admin") return null;

  async function run(action: () => Promise<void>, okText?: string) {
    try {
      await action();
      setMessage(okText ? { ok: true, text: okText } : null);
    } catch (err) {
      setMessage({ ok: false, text: errorText(t, err) });
    }
  }

  const replace = (updated: AppUser) => setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  const card = "rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900";
  const small = "rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800";

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            message.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          }`}
        >
          {message.text}
        </p>
      )}

      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold">{t.createUser}</h2>
        <CreateUserForm
          onCreate={(input) =>
            run(async () => {
              const created = await api.createUser(input);
              setUsers((prev) => [...prev, created]);
            }, t.userCreated)
          }
        />
      </section>

      <section className={card}>
        <h2 className="mb-3 text-lg font-semibold">
          {t.usersTitle} <span className="text-slate-400">({users.length})</span>
        </h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => {
            const isMe = u.id === user.id;
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {u.displayName} {isMe && <span className="text-slate-400">({t.you})</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">@{u.username}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    u.role === "admin" ? "bg-brand/10 text-brand dark:bg-brand/20" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {u.role === "admin" ? t.roleAdmin : t.roleUser}
                </span>
                <span className={`text-xs font-medium ${u.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  ● {u.isActive ? t.active : t.inactive}
                </span>
                {/* ห้ามลดสิทธิ์/ปิดใช้งานตัวเอง (เซิร์ฟเวอร์ก็กันไว้อีกชั้น) */}
                <div className="flex flex-wrap gap-1.5">
                  {!isMe && (
                    <>
                      <button type="button" className={small} onClick={() => run(async () => replace(await api.updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" })))}>
                        {u.role === "admin" ? t.makeUser : t.makeAdmin}
                      </button>
                      <button type="button" className={small} onClick={() => run(async () => replace(await api.updateUser(u.id, { isActive: !u.isActive })))}>
                        {u.isActive ? t.deactivate : t.activate}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={small}
                    onClick={() => {
                      const password = window.prompt(`${t.newPasswordPrompt} – @${u.username}`);
                      if (password) run(async () => replace(await api.updateUser(u.id, { password })), `${t.resetPassword} ✓`);
                    }}
                  >
                    {t.resetPassword}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function CreateUserForm({ onCreate }: { onCreate: (input: { username: string; displayName: string; password: string; role: Role }) => Promise<void> }) {
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await onCreate({ username, displayName, password, role });
    setBusy(false);
    setPassword("");
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-800";
  const label = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block">
        <span className={label}>{t.displayName}</span>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={input} required />
      </label>
      <label className="block">
        <span className={label}>{t.username}</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" className={input} required />
      </label>
      <label className="block">
        <span className={label}>{t.password}</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={input} required />
      </label>
      <label className="block">
        <span className={label}>{t.role}</span>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={input}>
          <option value="user">{t.roleUser}</option>
          <option value="admin">{t.roleAdmin}</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 sm:col-span-2"
      >
        {t.createUser}
      </button>
    </form>
  );
}
