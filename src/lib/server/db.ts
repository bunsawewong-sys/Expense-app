// การเชื่อมต่อ Supabase ฝั่งเซิร์ฟเวอร์เท่านั้น (ใช้ service role key ห้าม import ไฟล์นี้ในหน้าเว็บ)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any, "expense_app"> | null = null;

export class ConfigError extends Error {}

// ตัดช่องว่าง/ขึ้นบรรทัด/เครื่องหมายคำพูดที่ติดมาตอนคัดลอกค่าไปวาง (เช่นใน Vercel)
const clean = (value: string | undefined) => value?.trim().replace(/^["']|["']$/g, "").trim() ?? "";

// บอกชนิดของ key โดยไม่เปิดเผยตัว key (ใช้ตรวจปัญหาใน log): service_role / anon / publishable / unknown
export function describeKey(key: string) {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable (ผิด: ต้องใช้ service_role/secret)";
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
    return role === "service_role" ? "service_role" : `${role} (ผิด: ต้องใช้ service_role)`;
  } catch {
    return `unknown (length ${key.length})`;
  }
}

export function db() {
  if (client) return client;
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new ConfigError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set");
  console.log(`Supabase: ${url} · key type: ${describeKey(key)}`);
  // schema expense_app = ตารางทั้งหมดของแอป / ไม่เก็บ session ของ Supabase Auth (เราทำระบบล็อกอินเอง)
  client = createClient<any, "expense_app">(url, key, {
    db: { schema: "expense_app" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// แปลงแถวจาก database เป็นรูปแบบที่หน้าเว็บใช้
export type TransactionRow = {
  id: string;
  user_id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: string | number;
  currency: string;
  note: string;
  users?: { display_name: string } | null;
};

export const TRANSACTION_SELECT = "id, user_id, date, type, category, amount, currency, note, users!transactions_user_id_fkey(display_name)";

export function toTransaction(row: TransactionRow) {
  return {
    id: row.id,
    userId: row.user_id,
    ownerName: row.users?.display_name ?? "",
    date: row.date,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    currency: row.currency,
    note: row.note,
  };
}
