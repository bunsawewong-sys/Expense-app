import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { archiveLocalTransactions, loadLocalTransactions, type Transaction } from "@/lib/transactions";

// ถ้าเบราว์เซอร์นี้ยังมีข้อมูลจากแอปเวอร์ชันก่อน (localStorage) → เสนอให้นำเข้า database เป็นของคนที่ล็อกอิน
export default function ImportBanner({ onImported }: { onImported: () => void }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Transaction[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setItems(loadLocalTransactions());
  }, []);

  if (items.length === 0 && !message) return null;

  async function runImport() {
    setBusy(true);
    try {
      const result = await api.importTransactions(items);
      archiveLocalTransactions(); // ย้ายไปเก็บ key สำรอง ไม่ลบทิ้ง
      setItems([]);
      setMessage(`${t.importDone} ${result.imported}`);
      onImported();
    } catch (err) {
      setMessage(errorText(t, err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm dark:bg-brand/10">
      <p>{items.length > 0 ? `${t.importBanner}: ${items.length}` : message}</p>
      {items.length > 0 && (
        <button
          type="button"
          onClick={runImport}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-1.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {t.importButton}
        </button>
      )}
    </div>
  );
}
