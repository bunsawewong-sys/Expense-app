// ตรวจข้อมูลรายการที่ส่งมาจากหน้าเว็บอีกชั้นบนเซิร์ฟเวอร์ (ไม่เชื่อข้อมูลจากเบราว์เซอร์ 100%)
import { FALLBACK_CATEGORY, isCategoryOf } from "@/lib/categories";
import { isCurrencyCode } from "@/lib/currencies";
import type { TransactionInput } from "@/lib/transactions";

export function parseTransaction(raw: unknown): TransactionInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const amount = Math.round(Number(r.amount) * 100) / 100;
  if (!(amount > 0) || amount >= 1e12) return null;
  if (typeof r.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(Date.parse(r.date))) return null;
  if (!isCurrencyCode(r.currency)) return null;
  const type = r.type === "income" ? "income" : r.type === "expense" ? "expense" : null;
  if (!type) return null;
  return {
    date: r.date,
    type,
    category: typeof r.category === "string" && isCategoryOf(type, r.category) ? r.category : FALLBACK_CATEGORY,
    amount,
    currency: r.currency,
    note: typeof r.note === "string" ? r.note.trim().slice(0, 200) : "",
  };
}

// แปลงเป็นคอลัมน์ของตาราง expense_app.transactions
export const toRow = (t: TransactionInput, userId: string) => ({
  user_id: userId,
  date: t.date,
  type: t.type,
  category: t.category,
  amount: t.amount,
  currency: t.currency,
  note: t.note,
});
