import { FALLBACK_CATEGORY, isCategoryOf } from "./categories";
import { CURRENCIES, DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "./currencies";
import type { Lang } from "./i18n";

// ประเภทของรายการ: รายรับ หรือ รายจ่าย
export type TransactionType = "income" | "expense";

// ข้อมูล 1 รายการ
export type Transaction = {
  id: string; // รหัสไม่ซ้ำกัน ใช้ตอนแก้ไข/ลบ
  date: string; // รูปแบบ "YYYY-MM-DD" เช่น "2026-10-19"
  type: TransactionType;
  category: string; // id ของหมวด ดูใน categories.ts
  amount: number;
  currency: CurrencyCode;
  note: string; // หมายเหตุ (ว่างได้)
};

// ข้อมูลจากฟอร์ม (ยังไม่มี id)
export type TransactionInput = Omit<Transaction, "id">;

// ชื่อช่องเก็บข้อมูลใน localStorage ของเบราว์เซอร์ (ใช้ชื่อเดิม ข้อมูลเก่าจึงไม่หาย)
const STORAGE_KEY = "expense-tracker:transactions";
// ที่สำรองข้อมูลเวอร์ชันแรกไว้ก่อนแปลงเป็นรูปแบบใหม่ เผื่อมีอะไรผิดพลาด
const BACKUP_KEY = "expense-tracker:transactions:backup-v1";

// แปลงข้อมูล 1 รายการ (อาจเป็นรูปแบบเก่า) ให้ครบทุกช่องตามรูปแบบใหม่
function normalize(raw: unknown): Transaction | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const amount = Number(r.amount);
  if (!Number.isFinite(amount)) return null;

  const type: TransactionType = r.type === "income" ? "income" : "expense";
  return {
    id: typeof r.id === "string" && r.id ? r.id : createId(),
    date: typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : todayString(),
    type,
    // ไม่มีหมวด หรือหมวดไม่ตรงประเภท → "อื่น ๆ"
    category: typeof r.category === "string" && isCategoryOf(type, r.category) ? r.category : FALLBACK_CATEGORY,
    amount,
    // ไม่มีสกุลเงิน → บาท
    currency: isCurrencyCode(r.currency) ? r.currency : DEFAULT_CURRENCY,
    // แอปเวอร์ชันแรกเก็บข้อความไว้ในช่อง "description" → ย้ายมาเป็นหมายเหตุ
    note: typeof r.note === "string" ? r.note : typeof r.description === "string" ? r.description : "",
  };
}

function backupOnce(raw: string) {
  if (localStorage.getItem(BACKUP_KEY) === null) localStorage.setItem(BACKUP_KEY, raw);
}

// อ่านรายการทั้งหมดที่เคยบันทึกไว้ (ถ้ายังไม่มี ให้เริ่มจากว่าง)
export function loadTransactions(): Transaction[] {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const data: unknown = JSON.parse(saved);
    if (!Array.isArray(data)) {
      backupOnce(saved);
      return [];
    }
    // เจอข้อมูลรูปแบบเก่า (ยังไม่มีสกุลเงิน) → สำรองของเดิมไว้ก่อน
    if (data.some((item) => !item?.currency)) backupOnce(saved);
    return data.map(normalize).filter((t): t is Transaction => t !== null);
  } catch {
    try {
      if (saved) backupOnce(saved); // ข้อมูลเสียอ่านไม่ได้ ก็ยังเก็บสำเนาไว้
    } catch {}
    return [];
  }
}

// บันทึกรายการทั้งหมดลงเบราว์เซอร์ (localStorage เก็บได้แค่ข้อความ จึงแปลงเป็น JSON ก่อน)
export function saveTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    // เช่น โหมดไม่ระบุตัวตนบางเบราว์เซอร์ที่ไม่ยอมให้บันทึก: แอปยังใช้ต่อได้ แค่ไม่จำข้อมูล
  }
}

// ---------- รวมยอด ----------

export type CurrencyTotals = {
  currency: CurrencyCode;
  income: number;
  expense: number;
  balance: number;
};

// ปัดเป็นทศนิยม 2 ตำแหน่ง กันเศษแบบ 0.1 + 0.2 = 0.30000000000000004
const round = (n: number) => Math.round(n * 100) / 100;

// รวมยอดแยกตามสกุลเงิน (ไม่เอาต่างสกุลมาบวกกัน) เฉพาะสกุลที่มีรายการ เรียงตามลำดับใน CURRENCIES
export function sumByCurrency(transactions: Transaction[]): CurrencyTotals[] {
  return CURRENCIES.flatMap(({ code }) => {
    const items = transactions.filter((t) => t.currency === code);
    if (items.length === 0) return [];
    let income = 0;
    let expense = 0;
    for (const t of items) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return [{ currency: code, income: round(income), expense: round(expense), balance: round(income - expense) }];
  });
}

export type DayGroup = {
  date: string;
  items: Transaction[];
  totals: CurrencyTotals[];
};

// จัดกลุ่มตามวัน เรียงจากวันล่าสุดขึ้นก่อน พร้อมยอดรวมของแต่ละวัน
export function groupByDate(transactions: Transaction[]): DayGroup[] {
  const byDate = new Map<string, Transaction[]>();
  for (const t of transactions) {
    byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items, totals: sumByCurrency(items) }));
}

// ---------- ตัวช่วยอื่น ๆ ----------

// สร้างรหัสไม่ซ้ำแบบง่าย ๆ จากเวลา + ตัวเลขสุ่ม
export function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// แปลง Date เป็น "YYYY-MM-DD" ตามเวลาเครื่อง (ไม่ใช่ UTC)
function toDateString(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function todayString() {
  return toDateString(new Date());
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

// "today" / "yesterday" / null — ใช้ทำหัวข้อ "วันนี้", "เมื่อวาน"
export function relativeDay(date: string) {
  if (date === todayString()) return "today";
  if (date === yesterdayString()) return "yesterday";
  return null;
}

// ภาษาไทยใช้ปี ค.ศ. (u-ca-gregory) แทน พ.ศ.
const LOCALES: Record<Lang, string> = { th: "th-TH-u-ca-gregory", en: "en-GB" };

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "2026-10-19" → "19 ต.ค. 2026" / "19 Oct 2026"
export function formatDate(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "short", year: "numeric" }).format(
    parseDate(date),
  );
}

// "2026-10-19" → "วันจันทร์ที่ 19 ต.ค. 2026" / "Monday, 19 Oct 2026"
export function formatDayHeading(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseDate(date));
}
