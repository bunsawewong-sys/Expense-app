import { ConfigError } from "@/lib/server/db";

// ครอบ API ทุกตัว: ยังไม่ตั้งค่า Supabase → ตอบ "no_db" / error อื่น → "server" (รายละเอียดอยู่ใน log ฝั่งเซิร์ฟเวอร์)
export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ConfigError) return Response.json({ error: "no_db" }, { status: 500 });
    // error จาก Supabase เป็น object ธรรมดา: แสดง message/code ให้อ่านง่ายใน log
    console.error("API error:", err instanceof Error ? err : JSON.stringify(err));
    return Response.json({ error: "server" }, { status: 500 });
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
