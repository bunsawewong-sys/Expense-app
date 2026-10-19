import type { Messages } from "@/lib/i18n";
import type { TransactionInput } from "@/lib/transactions";

// ---------- รูปแบบข้อมูลที่ API /api/scan-slip ตอบกลับ (ใช้ร่วมกับ route.ts) ----------

// ข้อมูลจากสลิป: วันที่อาจเป็น null ถ้าในสลิปไม่มีวันที่
export type ScannedTransaction = Omit<TransactionInput, "date"> & { date: string | null };

export type ScanResult = { isSlip: false } | { isSlip: true; transaction: ScannedTransaction };

export type ScanErrorCode = "no_key" | "bad_key" | "quota" | "service" | "unreadable" | "bad_request" | "network";

// รหัส error → ข้อความในหน้าจอ (ดูใน i18n.ts)
export const SCAN_ERROR_MESSAGE: Record<ScanErrorCode, keyof Messages> = {
  no_key: "errNoKey",
  bad_key: "errBadKey",
  quota: "errQuota",
  service: "errService",
  unreadable: "errUnreadable",
  bad_request: "errBadRequest",
  network: "errNetwork",
};

export type ScanOutcome = { ok: true; result: ScanResult } | { ok: false; error: ScanErrorCode };

// ---------- ฝั่งเบราว์เซอร์ ----------

// ย่อรูปให้ด้านยาวไม่เกิน 1568px แล้วแปลงเป็น JPEG: อัปโหลดเร็วขึ้นและ AI อ่านได้เร็วขึ้น
export async function shrinkImage(file: File, maxSide = 1568): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85),
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ส่งรูป 1 ใบไปอ่าน ถ้าโควต้าฟรีเต็มชั่วคราว (429) จะรอแล้วลองใหม่เองสูงสุด 2 ครั้ง
export async function scanSlip(file: File, today: string, onWaiting: () => void): Promise<ScanOutcome> {
  let image: Blob;
  try {
    image = await shrinkImage(file);
  } catch {
    return { ok: false, error: "bad_request" };
  }

  for (let attempt = 0; ; attempt++) {
    const form = new FormData();
    form.append("image", image, "slip.jpg");
    form.append("today", today);

    let response: Response;
    try {
      response = await fetch("/api/scan-slip", { method: "POST", body: form });
    } catch {
      return { ok: false, error: "network" };
    }

    const data = await response.json().catch(() => ({ error: "service" }));
    if (response.ok) return { ok: true, result: data as ScanResult };

    if (response.status === 429 && attempt < 2) {
      onWaiting();
      await sleep(Math.min(Number(data.retryAfter) || 15, 60) * 1000);
      continue;
    }
    return { ok: false, error: (data.error as ScanErrorCode) ?? "service" };
  }
}

// ทำงานกับหลายชิ้น แต่ให้วิ่งพร้อมกันไม่เกิน limit ชิ้น (โควต้าฟรีต่อนาทีมีจำกัด)
export async function runWithLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await worker(items[next++]);
  });
  await Promise.all(runners);
}
