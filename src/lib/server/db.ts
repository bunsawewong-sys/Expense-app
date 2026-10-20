// การเชื่อมต่อ Supabase ฝั่งเซิร์ฟเวอร์เท่านั้น (ใช้ service role key ห้าม import ไฟล์นี้ในหน้าเว็บ)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any, "expense_app"> | null = null;

export class ConfigError extends Error {}

export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ConfigError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set");
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
