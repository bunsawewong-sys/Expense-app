import { useState } from "react";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import DailyBarChart from "@/components/charts/DailyBarChart";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";
import SummaryCards from "@/components/SummaryCards";
import { DEFAULT_CURRENCY, getCurrency, type CurrencyCode } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import {
  currentMonth,
  dailyTotals,
  expenseByCategory,
  filterByMonth,
  formatMonth,
  shiftMonth,
  sumByCurrency,
  type Transaction,
} from "@/lib/transactions";

// หน้าสรุปรายเดือน: เลือกเดือน + สกุลเงิน → การ์ด 3 ใบ, กราฟแท่งรายวัน, กราฟวงกลมตามหมวด
export default function SummaryDashboard({ transactions }: { transactions: Transaction[] }) {
  const { t, lang } = useI18n();
  const [month, setMonth] = useState(currentMonth);
  const [selected, setSelected] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  const monthItems = filterByMonth(transactions, month);
  // ไม่นำต่างสกุลมารวมกัน: ดูทีละสกุล (เฉพาะสกุลที่มีรายการในเดือนนี้)
  const currencies = sumByCurrency(monthItems).map((x) => x.currency);
  const currency = currencies.includes(selected) ? selected : (currencies[0] ?? DEFAULT_CURRENCY);
  const items = monthItems.filter((x) => x.currency === currency);
  const expenses = expenseByCategory(items);

  const card = "rounded-2xl bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900";
  const navButton =
    "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* เลือกเดือน */}
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
          <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t.prevMonth} title={t.prevMonth} className={navButton}>
            <ChevronLeftIcon />
          </button>
          <h2 className="min-w-36 text-center font-semibold">{formatMonth(month, lang)}</h2>
          <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label={t.nextMonth} title={t.nextMonth} className={navButton}>
            <ChevronRightIcon />
          </button>
        </div>

        {/* แท็บสกุลเงิน (แสดงเมื่อเดือนนี้มีมากกว่า 1 สกุล) */}
        {currencies.length > 1 && (
          <div role="tablist" aria-label={t.currency} className="flex flex-wrap gap-2">
            {currencies.map((code) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={code === currency}
                onClick={() => setSelected(code)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  code === currency
                    ? "bg-brand text-white"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {getCurrency(code).symbol} {code}
              </button>
            ))}
          </div>
        )}
      </div>

      {monthItems.length === 0 ? (
        <p className={`${card} py-16 text-center text-slate-400`}>{t.noDataMonth}</p>
      ) : (
        <>
          <SummaryCards transactions={items} />

          <section className={card}>
            <h3 className="mb-3 text-lg font-semibold">{t.dailyChartTitle}</h3>
            <DailyBarChart days={dailyTotals(items, month)} currency={currency} />
          </section>

          <section className={card}>
            <h3 className="mb-4 text-lg font-semibold">{t.categoryChartTitle}</h3>
            {expenses.length === 0 ? (
              <p className="py-10 text-center text-slate-400">{t.noExpenseMonth}</p>
            ) : (
              <CategoryPieChart items={expenses} currency={currency} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
