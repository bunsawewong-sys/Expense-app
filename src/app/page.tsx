"use client"; // หน้านี้ต้องทำงานในเบราว์เซอร์ เพราะใช้ localStorage และรับการกดปุ่ม

import { useEffect, useState } from "react";
import DeleteConfirm from "@/components/DeleteConfirm";
import Modal from "@/components/Modal";
import SlipScanner from "@/components/SlipScanner";
import SummaryCards from "@/components/SummaryCards";
import TransactionForm from "@/components/TransactionForm";
import TransactionLog from "@/components/TransactionLog";
import { useI18n } from "@/lib/i18n";
import {
  createId,
  loadTransactions,
  saveTransactions,
  type Transaction,
  type TransactionInput,
} from "@/lib/transactions";

// ส่วนหัว เมนู และภาษา อยู่ใน AppShell (layout.tsx) หน้านี้ดูแลแค่รายการ
export default function Home() {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null); // รายการที่กำลังแก้ไข
  const [deleting, setDeleting] = useState<Transaction | null>(null); // รายการที่รอยืนยันลบ

  // จังหวะที่ 1: เปิดหน้าเว็บครั้งแรก → ดึงข้อมูลเก่าจาก localStorage
  useEffect(() => {
    setTransactions(loadTransactions());
    setLoaded(true);
  }, []);

  // จังหวะที่ 2: ทุกครั้งที่รายการเปลี่ยน → บันทึกลง localStorage
  // (รอให้โหลดเสร็จก่อน ไม่งั้นจะเอารายการว่างไปเขียนทับข้อมูลเก่า)
  useEffect(() => {
    if (loaded) saveTransactions(transactions);
  }, [transactions, loaded]);

  function addTransaction(input: TransactionInput) {
    setTransactions((prev) => [{ ...input, id: createId() }, ...prev]);
  }

  // เพิ่มหลายรายการในครั้งเดียว (ใช้กับรายการจากสลิป)
  function addMany(inputs: TransactionInput[]) {
    setTransactions((prev) => [...inputs.map((input) => ({ ...input, id: createId() })), ...prev]);
  }

  function updateTransaction(input: TransactionInput) {
    if (!editing) return;
    const id = editing.id;
    setTransactions((prev) => prev.map((x) => (x.id === id ? { ...input, id } : x)));
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    setTransactions((prev) => prev.filter((x) => x.id !== id));
    setDeleting(null);
  }

  if (!loaded) return null;

  const card = "rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900";

  return (
    <>
      <SummaryCards transactions={transactions} />

      {/* จอเล็ก: เรียงลงมาคอลัมน์เดียว / จอใหญ่ (lg): ฟอร์มซ้าย กว้าง 380px, ประวัติขวา */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold">{t.addTitle}</h2>
          <SlipScanner onSave={addMany} />
          <TransactionForm submitLabel={t.addButton} onSubmit={addTransaction} />
        </section>

        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">
            {t.historyTitle} <span className="text-slate-400">({transactions.length})</span>
          </h2>
          <TransactionLog transactions={transactions} onEdit={setEditing} onDelete={setDeleting} />
        </section>
      </div>

      {/* กล่องแก้ไข: ใช้ฟอร์มเดียวกับตอนเพิ่ม แต่กรอกข้อมูลเดิมไว้ให้ */}
      {editing && (
        <Modal title={t.editTitle} onClose={() => setEditing(null)}>
          <TransactionForm
            initial={editing}
            submitLabel={t.save}
            onSubmit={updateTransaction}
            onCancel={() => setEditing(null)}
          />
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
