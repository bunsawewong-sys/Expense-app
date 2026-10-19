import { CATEGORIES } from "@/lib/categories";
import { useI18n } from "@/lib/i18n";
import type { TransactionType } from "@/lib/transactions";

type Props = {
  type: TransactionType;
  value: string;
  onChange: (id: string) => void;
};

// ปุ่มหมวดหมู่ (ไอคอน + ชื่อ) กดครั้งเดียวเลือกได้
export default function CategoryPicker({ type, value, onChange }: Props) {
  const { lang } = useI18n();

  return (
    <div className="grid grid-cols-4 gap-2">
      {CATEGORIES[type].map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] leading-tight transition sm:text-xs ${
              active
                ? "border-brand bg-brand/10 font-semibold text-brand dark:bg-brand/20"
                : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <span className="text-2xl leading-none">{c.icon}</span>
            <span className="text-center break-words">{c.name[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}
