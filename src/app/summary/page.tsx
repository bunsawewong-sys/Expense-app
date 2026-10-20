"use client";

import { useEffect, useState } from "react";
import OwnerFilter from "@/components/OwnerFilter";
import SummaryDashboard from "@/components/SummaryDashboard";
import { api, errorText } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { Transaction } from "@/lib/transactions";

// หน้าสรุป (/summary): อ่านรายการจากเซิร์ฟเวอร์อย่างเดียว (user = ของตัวเอง / admin = ทุกคนหรือกรองรายคน)
export default function SummaryPage() {
  const { t } = useI18n();
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .listTransactions(ownerFilter || undefined)
      .then((list) => {
        setTransactions(list);
        setError("");
      })
      .catch((err) => setError(`${t.loadFailed}: ${errorText(t, err)}`));
  }, [user, ownerFilter, t]);

  if (!user) return null;
  return (
    <>
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}
      {user.role === "admin" && (
        <div className="flex justify-end">
          <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />
        </div>
      )}
      {transactions && <SummaryDashboard transactions={transactions} />}
    </>
  );
}
