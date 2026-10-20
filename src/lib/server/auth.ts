// ระบบล็อกอินของแอปเอง (ไม่ใช้ Supabase Auth)
// - รหัสผ่านเก็บเป็น scrypt + salt (crypto ที่มากับ Node.js)
// - ล็อกอินแล้วได้ cookie "session" (token สุ่ม) ส่วนในตาราง sessions เก็บแค่ sha256 ของ token
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;

export type Role = "admin" | "user";
export type SessionUser = { id: string; username: string; displayName: string; role: Role };

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  return timingSafeEqual(actual, expected); // เทียบแบบใช้เวลาเท่ากัน กันการเดาจากเวลา
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// กติกาข้อมูลผู้ใช้ (ใช้ทั้งหน้า setup และหน้าจัดการผู้ใช้)
export function validateNewUser(input: { username?: unknown; displayName?: unknown; password?: unknown }) {
  const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return { error: "bad_username" as const };
  if (displayName.length < 1 || displayName.length > 80) return { error: "bad_name" as const };
  if (password.length < 8) return { error: "weak_password" as const };
  return { username, displayName, password };
}

// สร้าง session ใหม่ แล้วตั้ง cookie
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await db().from("sessions").insert({ user_id: userId, token_hash: sha256(token), expires_at: expires.toISOString() });
  if (error) throw error;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript ในหน้าเว็บอ่าน cookie นี้ไม่ได้
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db().from("sessions").delete().eq("token_hash", sha256(token));
  store.delete(SESSION_COOKIE);
}

// ใครล็อกอินอยู่ (null = ยังไม่ล็อกอิน / session หมดอายุ / บัญชีถูกปิดใช้งาน)
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { data } = await db()
    .from("sessions")
    .select("expires_at, users!inner(id, username, display_name, role, is_active)")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  const user = data?.users as unknown as { id: string; username: string; display_name: string; role: Role; is_active: boolean } | undefined;
  if (!data || !user || !user.is_active || new Date(data.expires_at) < new Date()) return null;
  return { id: user.id, username: user.username, displayName: user.display_name, role: user.role };
}

// ใช้ใน API: ถ้าไม่ผ่านจะได้ Response กลับไปตอบทันที
export async function requireUser(): Promise<SessionUser | Response> {
  const user = await getCurrentUser();
  return user ?? Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function requireAdmin(): Promise<SessionUser | Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  return user.role === "admin" ? user : Response.json({ error: "forbidden" }, { status: 403 });
}
