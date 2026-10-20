import { useEffect, useState } from "react";
import { api, type AppUser } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

// สำหรับ admin: เลือกดูรายการของทุกคน หรือของคนเดียว ("" = ทุกคน) / user ทั่วไปไม่เห็นตัวเลือกนี้
export default function OwnerFilter({ value, onChange }: { value: string; onChange: (userId: string) => void }) {
  const { t } = useI18n();
  const { user } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (user?.role === "admin") api.listUsers().then(setUsers).catch(() => setUsers([]));
  }, [user?.role]);

  if (user?.role !== "admin") return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{t.viewOf}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="">{t.everyone}</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName} (@{u.username}){u.id === user.id ? ` · ${t.you}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
