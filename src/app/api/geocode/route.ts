import { connection } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { reverseGeocode } from "@/lib/server/geocode";
import { handle } from "@/lib/server/handle";

// แปลงพิกัดเป็นชื่อสถานที่: GET /api/geocode?lat=13.746&lon=100.534&lang=th → { name: "ปทุมวัน, กรุงเทพมหานคร" }
// ต้องล็อกอินก่อน (กันคนนอกใช้เซิร์ฟเวอร์เราไปเรียก Nominatim)
export async function GET(request: Request) {
  await connection();
  return handle(async () => {
    const user = await requireUser();
    if (user instanceof Response) return user;

    const params = new URL(request.url).searchParams;
    const lat = Number(params.get("lat"));
    const lon = Number(params.get("lon"));
    if (!params.get("lat") || !params.get("lon") || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) {
      return Response.json({ error: "invalid" }, { status: 400 });
    }
    const lang = params.get("lang") === "en" ? "en" : "th";
    return Response.json({ name: await reverseGeocode(lat, lon, lang) });
  });
}
