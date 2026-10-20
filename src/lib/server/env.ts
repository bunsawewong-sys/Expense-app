// อ่านค่าตั้งค่า (env) ฝั่งเซิร์ฟเวอร์ แบบกันพลาดตอนคัดลอกไปวาง (เช่นใน Vercel):
// - ตัดช่องว่าง / ขึ้นบรรทัด / เครื่องหมายคำพูดหัวท้าย
// - ถ้าเผลอวางทั้งบรรทัด เช่น "SUPABASE_URL=https://..." จะตัด "SUPABASE_URL=" ออกให้
export function env(name: string): string {
  let value = (process.env[name] ?? "").trim();
  if (value.startsWith(`${name}=`)) value = value.slice(name.length + 1).trim();
  return value.replace(/^["']|["']$/g, "").trim();
}
