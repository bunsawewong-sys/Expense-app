import type { ReactNode } from "react";
import { PencilIcon, TrashIcon } from "@/components/Icons";
import LocationLink from "@/components/LocationLink";
import { getCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import {
  formatDate,
  formatDayHeading,
  groupByDate,
  relativeDay,
  type CurrencyTotals,
  type Transaction,
} from "@/lib/transactions";

type Props = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  showOwner?: boolean; // admin: แสดงชื่อเจ้าของรายการ
};

// ประวัติรายการ จัดกลุ่มตามวัน (วันล่าสุดอยู่บน)
export default function TransactionLog({ transactions, onEdit, onDelete, showOwner }: Props) {
  const { t } = useI18n();

  if (transactions.length === 0) {
    return <p className="py-10 text-center text-slate-400">{t.empty}</p>;
  }

  return (
    <div className="space-y-5">
      {groupByDate(transactions).map((group) => (
        <section key={group.date}>
          <DayHeader date={group.date} totals={group.totals} />
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.items.map((item) => (
              <TransactionRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} showOwner={showOwner} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// หัวข้อของแต่ละวัน: วันที่ + ยอด รับ / จ่าย / คงเหลือ ของวันนั้น (แยกบรรทัดตามสกุลเงิน)
function DayHeader({ date, totals }: { date: string; totals: CurrencyTotals[] }) {
  const { t, lang } = useI18n();
  const relative = relativeDay(date);
  const title = relative ? `${t[relative]} · ${formatDate(date, lang)}` : formatDayHeading(date, lang);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800/70">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-0.5 text-xs">
        {totals.map((total) => (
          <p key={total.currency} className="flex flex-wrap justify-end gap-x-3">
            <span className="text-emerald-600 dark:text-emerald-400">
              {t.dayIncome} {formatMoney(total.income, total.currency)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              {t.dayExpense} {formatMoney(total.expense, total.currency)}
            </span>
            <span className={`font-semibold ${total.balance < 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>
              {t.dayBalance} {formatMoney(total.balance, total.currency)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function TransactionRow({ item, onEdit, onDelete, showOwner }: { item: Transaction } & Omit<Props, "transactions">) {
  const { t, lang } = useI18n();
  const category = getCategory(item.type, item.category);
  const isIncome = item.type === "income";

  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${
          isIncome ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-rose-50 dark:bg-rose-500/15"
        }`}
      >
        {category.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{category.name[lang]}</p>
        {(item.note || (showOwner && item.ownerName)) && (
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {showOwner && item.ownerName && <span className="font-medium text-brand">👤 {item.ownerName}</span>}
            {showOwner && item.ownerName && item.note && " · "}
            {item.note}
          </p>
        )}
        <LocationLink location={item.location} />
      </div>
      <p
        className={`shrink-0 text-sm font-semibold sm:text-base ${
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {isIncome ? "+" : "−"}
        {formatMoney(item.amount, item.currency)}
      </p>
      <div className="flex shrink-0">
        <IconButton label={t.edit} onClick={() => onEdit(item)} hover="hover:text-brand">
          <PencilIcon />
        </IconButton>
        <IconButton label={t.delete} onClick={() => onDelete(item)} hover="hover:text-rose-600 dark:hover:text-rose-400">
          <TrashIcon />
        </IconButton>
      </div>
    </li>
  );
}

// ปุ่มไอคอนเล็ก (มี aria-label ให้โปรแกรมอ่านหน้าจอรู้ว่าเป็นปุ่มอะไร)
function IconButton(props: { label: string; onClick: () => void; hover: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.label}
      title={props.label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${props.hover}`}
    >
      {props.children}
    </button>
  );
}
