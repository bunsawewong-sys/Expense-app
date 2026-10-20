import { connection } from "next/server";
import { hashPassword, requireAdmin, validateNewUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";
import { USER_SELECT, toUser, type UserRow } from "@/lib/server/users";

// admin เท่านั้น: รายชื่อผู้ใช้ทั้งหมด
export async function GET() {
  await connection(); // อ่าน cookie ของแต่ละคำขอ จึงต้องทำงานตอนมีคำขอจริง (ห้ามสร้างล่วงหน้าตอน build)
  return handle(async () => {
    const admin = await requireAdmin();
    if (admin instanceof Response) return admin;
    const { data, error } = await db().from("users").select(USER_SELECT).order("created_at");
    if (error) throw error;
    return Response.json({ users: (data as UserRow[]).map(toUser) });
  });
}

// admin เท่านั้น: สร้างผู้ใช้ใหม่
export async function POST(request: Request) {
  return handle(async () => {
    const admin = await requireAdmin();
    if (admin instanceof Response) return admin;

    const body = await readJson(request);
    const input = validateNewUser(body);
    if ("error" in input) return Response.json({ error: input.error }, { status: 400 });
    const role = body.role === "admin" ? "admin" : "user";

    const { data, error } = await db()
      .from("users")
      .insert({ username: input.username, display_name: input.displayName, password_hash: await hashPassword(input.password), role, created_by: admin.id })
      .select(USER_SELECT)
      .single();
    if (error?.code === "23505") return Response.json({ error: "username_taken" }, { status: 409 }); // ชื่อซ้ำ
    if (error) throw error;
    return Response.json({ user: toUser(data as UserRow) }, { status: 201 });
  });
}
