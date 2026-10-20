// รูปแบบข้อมูลผู้ใช้ที่ส่งให้หน้าเว็บ (ไม่มี password_hash)
export const USER_SELECT = "id, username, display_name, role, is_active, created_at";

export type UserRow = { id: string; username: string; display_name: string; role: "admin" | "user"; is_active: boolean; created_at: string };

export const toUser = (u: UserRow) => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  role: u.role,
  isActive: u.is_active,
  createdAt: u.created_at,
});
