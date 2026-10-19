"use client"; // หน้านี้ต้องทำงานในเบราว์เซอร์ เพราะใช้ localStorage และรับการกดปุ่ม

import { useEffect, useState } from "react";
import DeleteConfirm from "@/components/DeleteConfirm";
import LanguageToggle from "@/components/LanguageToggle";
import Modal from "@/components/Modal";
import SummaryCards from "@/components/SummaryCards";
import ThemeToggle from "@/components/ThemeToggle";
import TransactionForm from "@/components/TransactionForm";
import TransactionLog from "@/components/TransactionLog";
import { I18nContext, MESSAGES, loadLang, saveLang, type Lang } from "@/lib/i18n";
import {
  createId,
  loadTransactions,
  saveTransactions,
  type Transaction,
  type TransactionInput,
} from "@/lib/transactions";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lang, setLang] = useState<Lang>("th");
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null); // รายการที่กำลังแก้ไข
  const [deleting, setDeleting] = useState<Transaction | null>(null); // รายการที่รอยืนยันลบ

  // จังหวะที่ 1: เปิดหน้าเว็บครั้งแรก → ดึงข้อมูลเก่าและภาษาที่เลือกไว้จาก localStorage
  useEffect(() => {
    setTransactions(loadTransactions());
    setLang(loadLang());
    setLoaded(true);
  }, []);

  // จังหวะที่ 2: ทุกครั้งที่รายการเปลี่ยน → บันทึกลง localStorage
  // (รอให้โหลดเสร็จก่อน ไม่งั้นจะเอารายการว่างไปเขียนทับข้อมูลเก่า)
  useEffect(() => {
    if (loaded) saveTransactions(transactions);
  }, [transactions, loaded]);

  const t = MESSAGES[lang];

  // เปลี่ยนภาษา → จำค่าไว้ และบอกเบราว์เซอร์ว่าหน้านี้เป็นภาษาอะไร
  useEffect(() => {
    if (!loaded) return;
    saveLang(lang);
    document.documentElement.lang = lang;
  }, [lang, loaded]);

  function addTransaction(input: TransactionInput) {
    setTransactions((prev) => [{ ...input, id: createId() }, ...prev]);
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

  // ระหว่างโหลด แสดงแค่วงกลมหมุน (กันข้อความภาษาไทยแวบขึ้นมาก่อนเปลี่ยนเป็นอังกฤษ)
  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <title>{t.appTitle}</title>
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </main>
    );
  }

  const card = "rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900";

  return (
    <I18nContext value={{ lang, t, setLang }}>
      {/* ชื่อบนแท็บเบราว์เซอร์ (React ย้ายแท็ก <title> ไปไว้ใน <head> ให้เอง) */}
      <title>{t.appTitle}</title>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand sm:text-3xl">{t.appTitle}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.appSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <SummaryCards transactions={transactions} />

        {/* จอเล็ก: เรียงลงมาคอลัมน์เดียว / จอใหญ่ (lg): ฟอร์มซ้าย กว้าง 380px, ประวัติขวา */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
          <section className={card}>
            <h2 className="mb-4 text-lg font-semibold">{t.addTitle}</h2>
            <TransactionForm submitLabel={t.addButton} onSubmit={addTransaction} />
          </section>

          <section className={card}>
            <h2 className="mb-3 text-lg font-semibold">
              {t.historyTitle} <span className="text-slate-400">({transactions.length})</span>
            </h2>
            <TransactionLog transactions={transactions} onEdit={setEditing} onDelete={setDeleting} />
          </section>
        </div>
      </main>

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
    </I18nContext>
  );
}
