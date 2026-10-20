"use client"; // หน้านี้ต้องทำงานในเบราว์เซอร์ เพราะรับการกดปุ่ม

import { useCallback, useEffect, useState } from "react";
import DeleteConfirm from "@/components/DeleteConfirm";
import ImportBanner from "@/components/ImportBanner";
import Modal from "@/components/Modal";
import OwnerFilter from "@/components/OwnerFilter";
import SlipScanner from "@/components/SlipScanner";
import SummaryCards from "@/components/SummaryCards";
import TransactionForm from "@/components/TransactionForm";
import TransactionLog from "@/components/TransactionLog";
import { api, errorText } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { Transaction, TransactionInput } from "@/lib/transactions";

// ข้อมูลอยู่ใน database (Supabase) ผ่าน API: user เห็นของตัวเอง / admin เห็นทุกคน
export default function Home() {
  const { t } = useI18n();
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [ownerFilter, setOwnerFilter] = useState(""); // admin: "" = ทุกคน
  const [editing, setEditing] = useState<Transaction | null>(null); // รายการที่กำลังแก้ไข
  const [deleting, setDeleting] = useState<Transaction | null>(null); // รายการที่รอยืนยันลบ

  const reload = useCallback(async () => {
    try {
      setTransactions(await api.listTransactions(ownerFilter || undefined));
      setError("");
    } catch (err) {
      setError(`${t.loadFailed}: ${errorText(t, err)}`);
    } finally {
      setLoaded(true);
    }
  }, [ownerFilter, t]);

  // ล็อกอินแล้ว (หรือเปลี่ยนตัวกรอง) → โหลดรายการจากเซิร์ฟเวอร์
  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  // ทุกการบันทึกส่งไปที่เซิร์ฟเวอร์ก่อน สำเร็จแล้วค่อยอัปเดตหน้าจอ
  async function run(action: () => Promise<void>) {
    try {
      await action();
      setError("");
    } catch (err) {
      setError(errorText(t, err));
    }
  }

  // เพิ่ม 1 รายการ หรือหลายรายการจากสลิป (เซิร์ฟเวอร์ส่งแจ้งเตือนเข้า Teams ให้)
  const addMany = (inputs: TransactionInput[]) =>
    run(async () => {
      const created = await api.createTransactions(inputs);
      // admin ที่กรองดูคนอื่นอยู่: รายการใหม่เป็นของตัวเอง จึงไม่ต้องแทรกลงหน้าจอ
      if (!ownerFilter || ownerFilter === user?.id) setTransactions((prev) => [...created, ...prev]);
    });

  const updateTransaction = (input: TransactionInput) =>
    run(async () => {
      if (!editing) return;
      const updated = await api.updateTransaction(editing.id, input);
      setTransactions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditing(null);
    });

  const confirmDelete = () =>
    run(async () => {
      if (!deleting) return;
      await api.deleteTransaction(deleting.id);
      setTransactions((prev) => prev.filter((x) => x.id !== deleting.id));
      setDeleting(null);
    });

  if (!user || !loaded) return null;

  const card = "rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900";
  const isAdmin = user.role === "admin";

  return (
    <>
      <ImportBanner onImported={reload} />

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}

      {isAdmin && (
        <div className="flex justify-end">
          <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />
        </div>
      )}

      <SummaryCards transactions={transactions} />

      {/* จอเล็ก: เรียงลงมาคอลัมน์เดียว / จอใหญ่ (lg): ฟอร์มซ้าย กว้าง 380px, ประวัติขวา */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">{t.addTitle}</h2>
          <SlipScanner onSave={addMany} />
          <TransactionForm submitLabel={t.addButton} onSubmit={(input) => addMany([input])} />
        </section>

        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">
            {t.historyTitle} <span className="text-slate-400">({transactions.length})</span>
          </h2>
          <TransactionLog transactions={transactions} onEdit={setEditing} onDelete={setDeleting} showOwner={isAdmin} />
        </section>
      </div>

      {/* กล่องแก้ไข: ใช้ฟอร์มเดียวกับตอนเพิ่ม แต่กรอกข้อมูลเดิมไว้ให้ */}
      {editing && (
        <Modal title={t.editTitle} onClose={() => setEditing(null)}>
          <TransactionForm initial={editing} submitLabel={t.save} onSubmit={updateTransaction} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {/* กล่องยืนยันก่อนลบ */}
      {deleting && (
        <Modal title={t.deleteTitle} onClose={() => setDeleting(null)}>
          <DeleteConfirm transaction={deleting} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
        </Modal>
      )}
    </>
  );
}
