// ตำแหน่งที่บันทึกรายการ: หาพิกัดจาก GPS ของเครื่อง แล้วถามเซิร์ฟเวอร์ว่าเป็นชื่อสถานที่อะไร
import type { Lang } from "./i18n";
import type { TransactionLocation } from "./transactions";

export type LocateError = "unsupported" | "denied" | "unavailable" | "timeout";
export type LocateResult = { ok: true; location: TransactionLocation } | { ok: false; error: LocateError };

// ขอพิกัดจากเบราว์เซอร์ (ครั้งแรกเบราว์เซอร์จะถามผู้ใช้ว่าอนุญาตไหม)
function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000, // รอไม่เกิน 10 วินาที
      maximumAge: 60_000, // ใช้ตำแหน่งที่หาไว้ไม่เกิน 1 นาทีได้เลย (เร็วขึ้น)
    }),
  );
}

async function placeName(lat: number, lon: number, lang: Lang) {
  try {
    const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}&lang=${lang}`);
    const data = await response.json();
    return typeof data.name === "string" ? data.name : "";
  } catch {
    return ""; // หาชื่อไม่ได้ก็ยังมีพิกัด
  }
}

export async function getCurrentLocation(lang: Lang): Promise<LocateResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return { ok: false, error: "unsupported" };
  try {
    const { coords } = await getPosition();
    const lat = Math.round(coords.latitude * 1e6) / 1e6;
    const lon = Math.round(coords.longitude * 1e6) / 1e6;
    return { ok: true, location: { name: await placeName(lat, lon, lang), lat, lon, accuracy: Math.round(coords.accuracy) } };
  } catch (err) {
    const code = (err as GeolocationPositionError)?.code;
    return { ok: false, error: code === 1 ? "denied" : code === 3 ? "timeout" : "unavailable" };
  }
}

export const hasCoords = (l: TransactionLocation): l is TransactionLocation & { lat: number; lon: number } =>
  typeof l.lat === "number" && typeof l.lon === "number";

// ข้อความที่แสดง: ชื่อสถานที่ หรือพิกัด (ถ้าหาชื่อไม่ได้)
export function locationLabel(l: TransactionLocation) {
  if (l.name) return l.name;
  return hasCoords(l) ? `${l.lat.toFixed(5)}, ${l.lon.toFixed(5)}` : "";
}

// ลิงก์เปิด Google Maps: มีพิกัดก็ปักหมุดตรงจุด / มีแค่ชื่อก็ค้นหาด้วยชื่อ
export function mapsUrl(l: TransactionLocation) {
  const q = hasCoords(l) ? `${l.lat},${l.lon}` : l.name;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}
