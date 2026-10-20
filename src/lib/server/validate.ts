// ตรวจข้อมูลรายการที่ส่งมาจากหน้าเว็บอีกชั้นบนเซิร์ฟเวอร์ (ไม่เชื่อข้อมูลจากเบราว์เซอร์ 100%)
import { FALLBACK_CATEGORY, isCategoryOf } from "@/lib/categories";
import { isCurrencyCode } from "@/lib/currencies";
import type { TransactionInput, TransactionLocation } from "@/lib/transactions";

// ตำแหน่ง: ไม่ส่งมา = ไม่ระบุ (null) / ส่งมาแต่ผิดรูปแบบ เช่น พิกัดเกินช่วง = undefined (ปฏิเสธทั้งรายการ)
function parseLocation(raw: unknown): TransactionLocation | null | undefined {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim().slice(0, 120) : "";
  if (r.lat == null && r.lon == null) return name ? { name } : null; // พิมพ์ชื่อเองอย่างเดียว ไม่มีพิกัด
  const { lat, lon, accuracy } = r;
  if (typeof lat !== "number" || typeof lon !== "number" || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) return undefined;
  return { name, lat, lon, ...(typeof accuracy === "number" && accuracy >= 0 ? { accuracy: Math.round(accuracy) } : {}) };
}

export function parseTransaction(raw: unknown): TransactionInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const amount = Math.round(Number(r.amount) * 100) / 100;
  if (!(amount > 0) || amount >= 1e12) return null;
  if (typeof r.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(Date.parse(r.date))) return null;
  if (!isCurrencyCode(r.currency)) return null;
  const type = r.type === "income" ? "income" : r.type === "expense" ? "expense" : null;
  if (!type) return null;
  const location = parseLocation(r.location);
  if (location === undefined) return null;
  return {
    date: r.date,
    type,
    category: typeof r.category === "string" && isCategoryOf(type, r.category) ? r.category : FALLBACK_CATEGORY,
    amount,
    currency: r.currency,
    note: typeof r.note === "string" ? r.note.trim().slice(0, 200) : "",
    location,
  };
}

// แปลงเป็นคอลัมน์ของตาราง expense_app.transactions (ใช้ทั้งตอนเพิ่มและแก้ไข)
export const toColumns = (t: TransactionInput) => ({
  date: t.date,
  type: t.type,
  category: t.category,
  amount: t.amount,
  currency: t.currency,
  note: t.note,
  location_name: t.location?.name || null,
  latitude: t.location?.lat ?? null,
  longitude: t.location?.lon ?? null,
  location_accuracy_m: t.location?.accuracy ?? null,
});

export const toRow = (t: TransactionInput, userId: string) => ({ user_id: userId, ...toColumns(t) });
