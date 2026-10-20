import { after, connection } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { TRANSACTION_SELECT, db, toTransaction, type TransactionRow } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";
import { notifyTransactions } from "@/lib/server/teams";
import { parseTransaction, toRow } from "@/lib/server/validate";

const MAX_BATCH = 50;

// ดูรายการ: user เห็นของตัวเอง / admin เห็นทุกคน (กรองคนเดียวด้วย ?userId=)
export async function GET(request: Request) {
  await connection(); // อ่าน cookie ของแต่ละคำขอ จึงต้องทำงานตอนมีคำขอจริง (ห้ามสร้างล่วงหน้าตอน build)
  return handle(async () => {
    const user = await requireUser();
    if (user instanceof Response) return user;

    let query = db().from("transactions").select(TRANSACTION_SELECT).order("date", { ascending: false }).order("created_at", { ascending: false });
    if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    } else {
      const filter = new URL(request.url).searchParams.get("userId");
      if (filter) query = query.eq("user_id", filter);
    }
    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ transactions: (data as unknown as TransactionRow[]).map(toTransaction) });
  });
}

// เพิ่มรายการ (1 รายการ หรือหลายรายการจากสลิป) แล้วแจ้งเตือนเข้า Teams
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (user instanceof Response) return user;

    const body = await readJson(request);
    const rawItems = Array.isArray(body.items) ? body.items : [body.item];
    const items = rawItems.map(parseTransaction);
    if (items.length === 0 || items.length > MAX_BATCH || items.some((t) => t === null)) {
      return Response.json({ error: "invalid" }, { status: 400 });
    }
    const valid = items as NonNullable<(typeof items)[number]>[];

    // รายการใหม่เป็นของคนที่ล็อกอินเสมอ (ไม่รับ user_id จากหน้าเว็บ)
    const { data, error } = await db().from("transactions").insert(valid.map((t) => toRow(t, user.id))).select(TRANSACTION_SELECT);
    if (error) throw error;

    // ส่งการ์ดหลังตอบหน้าเว็บแล้ว ผู้ใช้จะได้ไม่ต้องรอ Teams
    after(() => notifyTransactions(user, valid));
    return Response.json({ transactions: (data as unknown as TransactionRow[]).map(toTransaction) }, { status: 201 });
  });
}
