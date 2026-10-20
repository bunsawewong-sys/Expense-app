// แปลงพิกัด GPS เป็นชื่อสถานที่ (reverse geocoding) ด้วย OpenStreetMap Nominatim: ฟรี ไม่ต้องมี key
// กติกาการใช้ Nominatim: ต้องบอกชื่อแอปใน User-Agent / ไม่เกิน 1 ครั้งต่อวินาที / ควรเก็บผลไว้ใช้ซ้ำ
// https://operations.osmfoundation.org/policies/nominatim/
import { env } from "@/lib/server/env";

const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const MAX_CACHE = 500;

const cache = new Map<string, string>(); // "13.7460,100.5340,th" → "ปทุมวัน, กรุงเทพมหานคร"
let lastCall = 0;

// ส่วนที่อยู่จาก Nominatim (มีบางช่องเท่านั้น แล้วแต่ประเทศ/พื้นที่)
type Address = Partial<Record<"suburb" | "quarter" | "neighbourhood" | "village" | "town" | "city_district" | "city" | "county" | "state" | "province", string>>;

// เอาแค่ "ย่าน/เขต, เมือง/จังหวัด" ให้สั้นพออ่านง่ายในรายการ
function shortName(address: Address) {
  const area = address.suburb ?? address.quarter ?? address.neighbourhood ?? address.village ?? address.city_district;
  const city = address.city ?? address.town ?? address.province ?? address.state ?? address.county;
  return [...new Set([area, city].filter(Boolean))].join(", ");
}

// คืนชื่อสถานที่ หรือ "" ถ้าหาไม่ได้ (Nominatim ล่ม/ช้า) — ฟอร์มยังบันทึกได้ตามปกติ
export async function reverseGeocode(lat: number, lon: number, lang: "th" | "en") {
  // ปัดเป็นทศนิยม 4 ตำแหน่ง (~11 เมตร) ที่เดิมจะได้ใช้ผลเดิมซ้ำ
  const key = `${lat.toFixed(4)},${lon.toFixed(4)},${lang}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  // เว้นระยะอย่างน้อย 1 วินาทีระหว่างการเรียกแต่ละครั้ง
  const wait = lastCall + 1000 - Date.now();
  lastCall = Math.max(Date.now(), lastCall + 1000);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

  try {
    const url = `${ENDPOINT}?format=jsonv2&zoom=16&addressdetails=1&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&accept-language=${lang}`;
    const response = await fetch(url, {
      headers: { "User-Agent": `ExpenseTracker/1.0 (${env("APP_URL") || "personal expense app"})` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { address?: Address; display_name?: string };
    const name = (data.address ? shortName(data.address) : "") || (data.display_name ?? "").split(",").slice(0, 2).join(",").trim();
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
    cache.set(key, name);
    return name;
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return "";
  }
}
