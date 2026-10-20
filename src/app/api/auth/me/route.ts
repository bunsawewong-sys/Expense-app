import { connection } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handle } from "@/lib/server/handle";

// ใครล็อกอินอยู่ + ระบบมีผู้ใช้แล้วหรือยัง (ยังไม่มี = ต้องไปหน้า /setup)
export async function GET() {
  await connection(); // อ่าน cookie ของแต่ละคำขอ จึงต้องทำงานตอนมีคำขอจริง (ห้ามสร้างล่วงหน้าตอน build)
  return handle(async () => {
    const user = await getCurrentUser();
    if (user) return Response.json({ user });
    const { count } = await db().from("users").select("id", { count: "exact", head: true });
    return Response.json({ user: null, needsSetup: (count ?? 0) === 0 }, { status: 401 });
  });
}
