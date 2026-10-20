import { useState, type FormEvent } from "react";
import CategoryPicker from "@/components/CategoryPicker";
import LocationField from "@/components/LocationField";
import { isCategoryOf } from "@/lib/categories";
import { CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currencies";
import { useI18n, type Messages } from "@/lib/i18n";
import { todayString, type TransactionInput, type TransactionLocation, type TransactionType } from "@/lib/transactions";

type Props = {
  initial?: TransactionInput; // มีค่า = โหมดแก้ไข (กรอกข้อมูลเดิมไว้ให้)
  submitLabel: string;
  onSubmit: (transaction: TransactionInput) => void;
  onCancel?: () => void; // มีค่า = แสดงปุ่มยกเลิก
};

// ฟอร์มเดียวใช้ทั้ง "เพิ่ม" และ "แก้ไข"
export default function TransactionForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { t } = useI18n();

  // ค่าที่ผู้ใช้กำลังกรอกในแต่ละช่อง (โหมดแก้ไขเริ่มจากค่าเดิม)
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState<CurrencyCode>(initial?.currency ?? DEFAULT_CURRENCY);
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [note, setNote] = useState(initial?.note ?? "");
  const [location, setLocation] = useState<TransactionLocation | null>(initial?.location ?? null);
  // โหมดเพิ่ม: หาตำแหน่งทันทีที่เปิดฟอร์ม (1) / โหมดแก้ไข: ใช้ตำแหน่งเดิม ไม่หาใหม่จนกว่าจะกดปุ่ม (0)
  const [locateSignal, setLocateSignal] = useState(initial ? 0 : 1);
  // เก็บเป็น "ชื่อข้อความ" แทนตัวข้อความ จะได้เปลี่ยนภาษาตามได้ทันที
  const [error, setError] = useState<keyof Messages | null>(null);

  function changeType(next: TransactionType) {
    setType(next);
    // รายรับกับรายจ่ายมีหมวดไม่เหมือนกัน: ถ้าหมวดเดิมไม่มีในประเภทใหม่ ให้ล้างออก
    if (!isCategoryOf(next, category)) setCategory("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // กันเบราว์เซอร์โหลดหน้าใหม่ตอนกดส่งฟอร์ม

    const value = Number(amount);
    if (!category) return setError("errorCategory");
    if (!(value > 0)) return setError("errorAmount");
    if (!date) return setError("errorDate");

    onSubmit({ date, type, category, amount: value, currency, note: note.trim(), location: location && { ...location, name: location.name.trim() } });
    setError(null);

    // โหมดเพิ่ม: ล้างช่อง เหลือประเภท วันที่ และสกุลเงินไว้ เผื่อกรอกรายการต่อไป
    if (!initial) {
      setCategory("");
      setAmount("");
      setNote("");
      setLocateSignal((n) => n + 1); // รายการถัดไปอาจอยู่คนละที่ หาตำแหน่งใหม่
    }
  }

  const label = "mb-1 block text-sm font-medium";
  // สไตล์กลางของช่องกรอก (ความกว้างกำหนดแยกแต่ละช่อง)
  const input =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-800";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <span className={label}>{t.type}</span>
        <div className="grid grid-cols-2 gap-2">
          <TypeButton label={t.income} active={type === "income"} activeClass="bg-emerald-600" onClick={() => changeType("income")} />
          <TypeButton label={t.expense} active={type === "expense"} activeClass="bg-rose-600" onClick={() => changeType("expense")} />
        </div>
      </div>

      <div>
        <span className={label}>{t.category}</span>
        <CategoryPicker type={type} value={category} onChange={setCategory} />
      </div>

      <div>
        <span className={label}>{t.amount}</span>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            aria-label={t.amount}
            className={`${input} min-w-0 flex-1`}
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            aria-label={t.currency}
            className={`${input} shrink-0`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="block">
        <span className={label}>{t.date}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} w-full`} />
      </label>

      <label className="block">
        <span className={label}>{t.note}</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          maxLength={100}
          className={`${input} w-full`}
        />
      </label>

      <LocationField value={location} onChange={setLocation} locateSignal={locateSignal} />

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{t[error]}</p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t.cancel}
          </button>
        )}
        <button
          type="submit"
          className="flex-1 rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ปุ่มเลือกประเภท: ปุ่มที่ถูกเลือกจะเป็นสีทึบ
function TypeButton(props: { label: string; active: boolean; activeClass: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={props.active}
      className={`rounded-lg px-3 py-2 font-medium transition ${
        props.active
          ? `${props.activeClass} text-white`
          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {props.label}
    </button>
  );
}
