import { hashPassword, requireAdmin } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { handle, readJson } from "@/lib/server/handle";
import { USER_SELECT, toUser, type UserRow } from "@/lib/server/users";

// admin เท่านั้น: เปลี่ยนชื่อ / role / ปิด-เปิดใช้งาน / รีเซ็ตรหัสผ่าน
export async function PATCH(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  return handle(async () => {
    const admin = await requireAdmin();
    if (admin instanceof Response) return admin;
    const { id } = await ctx.params;
    const body = await readJson(request);

    const update: Record<string, unknown> = {};
    if (typeof body.displayName === "string") {
      const name = body.displayName.trim();
      if (name.length < 1 || name.length > 80) return Response.json({ error: "bad_name" }, { status: 400 });
      update.display_name = name;
    }
    if (body.role === "admin" || body.role === "user") update.role = body.role;
    if (typeof body.isActive === "boolean") update.is_active = body.isActive;
    if (typeof body.password === "string") {
      if (body.password.length < 8) return Response.json({ error: "weak_password" }, { status: 400 });
      update.password_hash = await hashPassword(body.password);
    }
    if (Object.keys(update).length === 0) return Response.json({ error: "invalid" }, { status: 400 });

    // กันไม่ให้ admin ลดสิทธิ์หรือปิดใช้งานตัวเอง (จะได้มี admin อย่างน้อย 1 คนเสมอ)
    if (id === admin.id && (update.role === "user" || update.is_active === false)) {
      return Response.json({ error: "self_lockout" }, { status: 400 });
    }

    const { data, error } = await db().from("users").update(update).eq("id", id).select(USER_SELECT).maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ error: "not_found" }, { status: 404 });

    // ปิดใช้งาน หรือเปลี่ยนรหัสผ่าน → ล็อกอินเดิมของคนนั้นใช้ไม่ได้ทันที
    if (update.is_active === false || update.password_hash) await db().from("sessions").delete().eq("user_id", id);
    return Response.json({ user: toUser(data as UserRow) });
  });
}
