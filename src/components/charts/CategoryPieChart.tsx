import { useState } from "react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { formatMoney, type CurrencyCode } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import type { CategoryTotal } from "@/lib/transactions";

// กราฟวงกลม (donut) รายจ่ายตามหมวด วาดด้วย SVG เอง
const MAX_SLICES = 6; // ชิ้นเยอะกว่านี้อ่านยาก → รวมหมวดเล็ก ๆ เป็น "อื่น ๆ"
const SIZE = 200;
const C = SIZE / 2;
const R_OUTER = 92;
const R_INNER = 58;

// สีประจำหมวด: ตายตัวตามลำดับหมวด (ไม่เปลี่ยนตามยอด) ค่าสีอยู่ใน globals.css
const EXPENSE_ORDER = CATEGORIES.expense.map((c) => c.id);
const colorOf = (category: string) => `var(--viz-${EXPENSE_ORDER.indexOf(category) + 1})`;

type Props = { items: CategoryTotal[]; currency: CurrencyCode };

export default function CategoryPieChart({ items, currency }: Props) {
  const { t, lang } = useI18n();
  const [hover, setHover] = useState<string | null>(null);

  const slices = foldSmallSlices(items);
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  const percent = (amount: number) =>
    new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US", { style: "percent", maximumFractionDigits: 1 }).format(amount / total);

  // วาดชิ้นตามลำดับหมวด (สีที่อยู่ติดกันจึงเป็นคู่ที่ผ่านการตรวจตาบอดสี) / รายการด้านข้างเรียงจากมากไปน้อย
  const drawOrder = [...slices].sort((a, b) => EXPENSE_ORDER.indexOf(a.category) - EXPENSE_ORDER.indexOf(b.category));
  const legendOrder = [...slices].sort((a, b) => b.amount - a.amount);

  let angle = -Math.PI / 2; // เริ่มที่ตำแหน่ง 12 นาฬิกา
  const arcs = drawOrder.map((s) => {
    const start = angle;
    angle += (s.amount / total) * Math.PI * 2;
    return { ...s, start, end: angle };
  });

  const focus = slices.find((s) => s.category === hover);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={t.categoryChartTitle}
        className="shrink-0"
        onPointerLeave={() => setHover(null)}
      >
        {arcs.length === 1 ? (
          <circle cx={C} cy={C} r={(R_OUTER + R_INNER) / 2} fill="none" stroke={colorOf(arcs[0].category)} strokeWidth={R_OUTER - R_INNER} />
        ) : (
          arcs.map((a) => (
            <path
              key={a.category}
              d={donutPath(a.start, a.end)}
              fill={colorOf(a.category)}
              // เส้นสีพื้นการ์ด 2px = ช่องว่างระหว่างชิ้น
              stroke="var(--viz-surface)"
              strokeWidth={2}
              opacity={hover && hover !== a.category ? 0.35 : 1}
              className="cursor-pointer transition-opacity"
              onPointerEnter={() => setHover(a.category)}
              onPointerDown={() => setHover(a.category)}
            />
          ))
        )}

        {/* ตรงกลาง: ยอดรวม หรือยอดของหมวดที่ชี้อยู่ */}
        <text x={C} y={C - 10} textAnchor="middle" className="fill-slate-500 text-[12px] dark:fill-slate-400">
          {focus ? getCategory("expense", focus.category).name[lang] : t.total}
        </text>
        <text x={C} y={C + 12} textAnchor="middle" className="fill-slate-800 text-[15px] font-bold dark:fill-slate-100">
          {formatMoney(focus ? focus.amount : total, currency)}
        </text>
        {focus && (
          <text x={C} y={C + 30} textAnchor="middle" className="fill-slate-500 text-[12px] dark:fill-slate-400">
            {percent(focus.amount)}
          </text>
        )}
      </svg>

      {/* แถบอธิบายสี + ตัวเลข (ใช้แทนตารางได้ด้วย) */}
      <ul className="w-full min-w-0 flex-1 space-y-1 text-sm">
        {legendOrder.map((s) => {
          const category = getCategory("expense", s.category);
          return (
            <li
              key={s.category}
              onPointerEnter={() => setHover(s.category)}
              onPointerLeave={() => setHover(null)}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
                hover === s.category ? "bg-slate-100 dark:bg-slate-800" : ""
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorOf(s.category) }} />
              <span className="min-w-0 flex-1 truncate">
                {category.icon} {category.name[lang]}
              </span>
              <span className="shrink-0 font-medium tabular-nums">{formatMoney(s.amount, currency)}</span>
              <span className="w-14 shrink-0 text-right text-slate-500 tabular-nums dark:text-slate-400">{percent(s.amount)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// เก็บ 5 หมวดที่ยอดสูงสุดไว้ ที่เหลือรวมเข้า "อื่น ๆ"
function foldSmallSlices(items: CategoryTotal[]): CategoryTotal[] {
  if (items.length <= MAX_SLICES) return items;
  const sorted = [...items].sort((a, b) => b.amount - a.amount);
  const keep = sorted.filter((s) => s.category !== "other").slice(0, MAX_SLICES - 1);
  const rest = sorted.filter((s) => !keep.includes(s)).reduce((sum, s) => sum + s.amount, 0);
  return [...keep, { category: "other", amount: Math.round(rest * 100) / 100 }];
}

// รูปชิ้นของ donut จากมุมเริ่มถึงมุมจบ (เรเดียน)
function donutPath(start: number, end: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => `${C + r * Math.cos(a)},${C + r * Math.sin(a)}`;
  return [
    `M${p(R_OUTER, start)}`,
    `A${R_OUTER},${R_OUTER} 0 ${large} 1 ${p(R_OUTER, end)}`,
    `L${p(R_INNER, end)}`,
    `A${R_INNER},${R_INNER} 0 ${large} 0 ${p(R_INNER, start)}`,
    "Z",
  ].join(" ");
}
