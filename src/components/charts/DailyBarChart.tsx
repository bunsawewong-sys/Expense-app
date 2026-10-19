import { useEffect, useRef, useState, type RefObject } from "react";
import { formatMoney, type CurrencyCode } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import { formatDate, type DayTotal } from "@/lib/transactions";

// กราฟแท่งคู่รายวัน (วาดด้วย SVG เอง): แท่งซ้าย = รายรับ, แท่งขวา = รายจ่าย
const HEIGHT = 220;
const M = { top: 12, right: 8, bottom: 24, left: 44 }; // ระยะขอบสำหรับป้ายแกน
const MIN_DAY_WIDTH = 16; // จอแคบกว่านี้ กราฟจะเลื่อนแนวนอนได้แทนการบีบแท่ง

type Props = { days: DayTotal[]; currency: CurrencyCode };

export default function DailyBarChart({ days, currency }: Props) {
  const { t, lang } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapRef);
  const [hover, setHover] = useState<number | null>(null);

  const svgWidth = Math.max(width, days.length * MIN_DAY_WIDTH + M.left + M.right);
  const plotW = svgWidth - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const ticks = niceTicks(Math.max(0, ...days.flatMap((d) => [d.income, d.expense])));
  const top = ticks[ticks.length - 1] || 1;
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const band = plotW / days.length;
  const barW = Math.min(12, Math.max(2, (band - 6) / 2)); // แท่งบาง เหลือที่ว่างระหว่างวัน
  const showEveryDay = band >= 28;

  const hovered = hover === null ? null : days[hover];
  const hoverX = hover === null ? 0 : M.left + band * hover + band / 2;

  return (
    <div className="space-y-3">
      {/* แถบอธิบายสี (กราฟมี 2 ชุดข้อมูล) */}
      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-300">
        <LegendKey color="var(--viz-income)" label={t.income} />
        <LegendKey color="var(--viz-expense)" label={t.expense} />
      </div>

      <div ref={wrapRef} className="overflow-x-auto" onPointerLeave={() => setHover(null)}>
        {width > 0 && (
          <div className="relative" style={{ width: svgWidth }}>
            <svg width={svgWidth} height={HEIGHT} role="img" aria-label={t.dailyChartTitle} className="block">
              {/* เส้นตาราง + ตัวเลขแกน Y */}
              {ticks.map((tick) => (
                <g key={tick}>
                  <line x1={M.left} x2={svgWidth - M.right} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} strokeWidth={1} />
                  <text x={M.left - 6} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">
                    {compact(tick)}
                  </text>
                </g>
              ))}

              {days.map((d, i) => {
                const cx = M.left + band * i + band / 2;
                return (
                  <g key={d.date}>
                    {hover === i && <rect x={cx - band / 2} y={M.top} width={band} height={plotH} className="fill-slate-500/10" />}
                    <path d={barPath(cx - 1 - barW, d.income, barW, y)} fill="var(--viz-income)" />
                    <path d={barPath(cx + 1, d.expense, barW, y)} fill="var(--viz-expense)" />
                    {(showEveryDay || d.day === 1 || d.day % 5 === 0) && (
                      <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-400 text-[11px] tabular-nums">
                        {d.day}
                      </text>
                    )}
                    {/* พื้นที่รับการชี้/แตะ กว้างทั้งวัน (ใหญ่กว่าแท่ง กดง่ายบนมือถือ) */}
                    <rect
                      x={cx - band / 2}
                      y={M.top}
                      width={band}
                      height={plotH}
                      fill="transparent"
                      onPointerEnter={() => setHover(i)}
                      onPointerDown={() => setHover(i)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* กล่องตัวเลขเมื่อชี้/แตะที่วันไหน */}
            {hovered && (
              <div
                className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg bg-white p-2.5 text-xs shadow-lg ring-1 ring-black/10 dark:bg-slate-800 dark:ring-white/10"
                style={{ left: Math.min(Math.max(hoverX, 92), svgWidth - 92) }}
              >
                <p className="mb-1 font-semibold">{formatDate(hovered.date, lang)}</p>
                <TooltipRow color="var(--viz-income)" label={t.income} value={formatMoney(hovered.income, currency)} />
                <TooltipRow color="var(--viz-expense)" label={t.expense} value={formatMoney(hovered.expense, currency)} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ตารางสำหรับคนที่อ่านกราฟลำบาก / โปรแกรมอ่านหน้าจอ */}
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-500 dark:text-slate-400">{t.showTable}</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-1 font-medium">{t.day}</th>
              <th className="py-1 text-right font-medium">{t.income}</th>
              <th className="py-1 text-right font-medium">{t.expense}</th>
            </tr>
          </thead>
          <tbody>
            {days
              .filter((d) => d.income > 0 || d.expense > 0)
              .map((d) => (
                <tr key={d.date} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1">{formatDate(d.date, lang)}</td>
                  <td className="py-1 text-right">{formatMoney(d.income, currency)}</td>
                  <td className="py-1 text-right">{formatMoney(d.expense, currency)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </p>
  );
}

// แท่งกราฟ: ปลายบนมน 4px ฐานล่างเหลี่ยม (ค่ามากกว่า 0 แต่เล็กมาก จะสูงอย่างน้อย 2px ให้มองเห็น)
function barPath(x: number, value: number, w: number, y: (v: number) => number) {
  if (value <= 0) return "";
  const base = y(0);
  const yTop = Math.min(y(value), base - 2);
  const r = Math.min(4, w / 2, base - yTop);
  return `M${x},${base}V${yTop + r}Q${x},${yTop} ${x + r},${yTop}H${x + w - r}Q${x + w},${yTop} ${x + w},${yTop + r}V${base}Z`;
}

// ขีดแกน Y เป็นตัวเลขกลม ๆ ประมาณ 4 ขีด เช่น 0 / 5K / 10K / 15K
function niceTicks(max: number) {
  if (max <= 0) return [0];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const r = raw / mag;
  const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
  const count = Math.ceil(max / step);
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 100) / 100);
}

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const compact = (v: number) => compactFormatter.format(v);

// วัดความกว้างกล่อง (และวัดใหม่เมื่อหน้าจอเปลี่ยนขนาด) เพื่อวาดกราฟให้พอดี
function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
