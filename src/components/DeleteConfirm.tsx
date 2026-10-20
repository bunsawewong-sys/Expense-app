import LocationLink from "@/components/LocationLink";
import { getCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import { formatDate, type Transaction } from "@/lib/transactions";

type Props = {
  transaction: Transaction;
  onConfirm: () => void;
  onCancel: () => void;
};

// เนื้อหาในกล่องยืนยันลบ: แสดงรายการที่จะลบให้เห็นชัด ๆ ก่อนกดยืนยัน
export default function DeleteConfirm({ transaction, onConfirm, onCancel }: Props) {
  const { t, lang } = useI18n();
  const category = getCategory(transaction.type, transaction.category);
  const isIncome = transaction.type === "income";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
        <span className="text-2xl">{category.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{category.name[lang]}</p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {formatDate(transaction.date, lang)}
            {transaction.note && ` · ${transaction.note}`}
          </p>
          <LocationLink location={transaction.location} />
        </div>
        <p className={`shrink-0 font-semibold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {isIncome ? "+" : "−"}
          {formatMoney(transaction.amount, transaction.currency)}
        </p>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{t.deleteHint}</p>

      <div className="flex gap-2">
        {/* ปุ่มยกเลิกอยู่ก่อน: เบราว์เซอร์จะโฟกัสปุ่มนี้ให้ กด Enter พลาดก็ไม่ลบ */}
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700"
        >
          {t.delete}
        </button>
      </div>
    </div>
  );
}
