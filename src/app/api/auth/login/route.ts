import { startSession, verifyPassword } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";

// ล็อกอินด้วย username + รหัสผ่าน
export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const { data: user } = await db()
      .from("users")
      .select("id, password_hash, is_active")
      .eq("username", username)
      .maybeSingle();

    // ตอบข้อความเดียวกันทั้ง "ไม่มีผู้ใช้" และ "รหัสผิด" จะได้เดาไม่ได้ว่า username ไหนมีอยู่จริง
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return Response.json({ error: "bad_login" }, { status: 401 });
    }
    if (!user.is_active) return Response.json({ error: "disabled" }, { status: 403 });

    await startSession(user.id);
    return Response.json({ ok: true });
  });
}
