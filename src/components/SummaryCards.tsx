import { useState } from "react";
import { DEFAULT_CURRENCY, formatMoney, getCurrency, type CurrencyCode } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import { sumByCurrency, type CurrencyTotals, type Transaction } from "@/lib/transactions";

export default function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  // ยอดรวมแยกสกุลเงิน (ยังไม่มีรายการเลย → แสดงเป็นบาท 0.00)
  const totals = sumByCurrency(transactions);
  const list: CurrencyTotals[] =
    totals.length > 0 ? totals : [{ currency: DEFAULT_CURRENCY, income: 0, expense: 0, balance: 0 }];
  // ถ้าสกุลที่เลือกไว้ไม่มีรายการแล้ว (เช่น ลบหมด) ให้ไปแสดงสกุลแรกแทน
  const current = list.find((x) => x.currency === selected) ?? list[0];

  return (
    <div className="space-y-3">
      {/* แท็บสกุลเงิน: แสดงเมื่อมีรายการตั้งแต่ 2 สกุลขึ้นไป */}
      {list.length > 1 && (
        <div role="tablist" aria-label={t.currency} className="flex flex-wrap gap-2">
          {list.map(({ currency }) => {
            const active = currency === current.currency;
            return (
              <button
                key={currency}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelected(currency)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand text-white"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {getCurrency(currency).symbol} {currency}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.totalIncome}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatMoney(current.income, current.currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.totalExpense}</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatMoney(current.expense, current.currency)}
          </p>
        </div>
        {/* การ์ดคงเหลือเป็นสีน้ำเงิน แต่ถ้าติดลบ (ใช้เกินรายรับ) จะเปลี่ยนเป็นสีแดงเตือน */}
        <div className={`rounded-2xl p-5 text-white shadow-sm ${current.balance < 0 ? "bg-rose-600" : "bg-brand"}`}>
          <p className="text-sm text-white/80">{t.balance}</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(current.balance, current.currency)}</p>
        </div>
      </div>
    </div>
  );
}
