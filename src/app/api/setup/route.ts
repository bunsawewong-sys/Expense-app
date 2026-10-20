import { hashPassword, startSession, validateNewUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";

// สร้าง admin คนแรก: ใช้ได้เฉพาะตอนที่ระบบยังไม่มีผู้ใช้เลย
export async function POST(request: Request) {
  return handle(async () => {
    const { count, error: countError } = await db().from("users").select("id", { count: "exact", head: true });
    if (countError) throw countError; // ต่อ database ไม่ได้ ต้องไม่ถือว่า "ยังไม่มีผู้ใช้"
    if ((count ?? 0) > 0) return Response.json({ error: "already_setup" }, { status: 409 });

    const input = validateNewUser(await readJson(request));
    if ("error" in input) return Response.json({ error: input.error }, { status: 400 });

    const { data, error } = await db()
      .from("users")
      .insert({ username: input.username, display_name: input.displayName, password_hash: await hashPassword(input.password), role: "admin" })
      .select("id")
      .single();
    if (error) throw error;

    await startSession(data.id);
    return Response.json({ ok: true });
  });
}
