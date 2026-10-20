import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";
import { parseTransaction, toRow } from "@/lib/server/validate";

const MAX_IMPORT = 2000;

// นำเข้าข้อมูลเดิมจาก localStorage เป็นของคนที่ล็อกอิน (ไม่ส่งแจ้งเตือน Teams)
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (user instanceof Response) return user;

    const body = await readJson(request);
    const raw = Array.isArray(body.items) ? body.items.slice(0, MAX_IMPORT) : [];
    const items = raw.map(parseTransaction).filter((t) => t !== null);
    if (items.length === 0) return Response.json({ imported: 0, skipped: raw.length });

    const { error } = await db().from("transactions").insert(items.map((t) => toRow(t, user.id)));
    if (error) throw error;
    return Response.json({ imported: items.length, skipped: raw.length - items.length });
  });
}
