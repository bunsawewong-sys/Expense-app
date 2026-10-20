// API อ่านสลิป: เบราว์เซอร์ส่งรูปมา → ส่งต่อให้ OpenAI อ่าน → ตอบกลับเป็นข้อมูลรายการ
// ไฟล์นี้ทำงานบนเซิร์ฟเวอร์เท่านั้น API key จึงไม่หลุดไปถึงเบราว์เซอร์
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/server/auth";
import { CATEGORIES, FALLBACK_CATEGORY, isCategoryOf } from "@/lib/categories";
import { CURRENCIES, DEFAULT_CURRENCY, isCurrencyCode } from "@/lib/currencies";
import type { ScanErrorCode, ScanResult } from "@/lib/scanSlip";
import { env } from "@/lib/server/env";

// รุ่น AI ที่ใช้ (รุ่น mini อ่านรูปได้และราคาถูก) เปลี่ยนรุ่นได้ที่นี่ที่เดียว
const MODEL = "gpt-5.4-mini";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // เบราว์เซอร์ย่อรูปให้แล้ว ปกติไม่ถึง 1MB

const CATEGORY_IDS = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income].map((c) => c.id))];

// รูปแบบคำตอบที่บังคับให้ AI ตอบ (JSON Schema) จะได้แปลงเป็นข้อมูลได้แน่นอน
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_slip: { type: "boolean", description: "true if the image is a payment slip, transfer slip, receipt or bill" },
    type: { type: "string", enum: ["income", "expense"] },
    amount: { type: "number", description: "Transaction amount as a plain number, e.g. 1250.50" },
    currency: { type: "string", enum: CURRENCIES.map((c) => c.code) },
    date: { type: ["string", "null"], description: "Transaction date in Gregorian YYYY-MM-DD, or null" },
    category: { type: "string", enum: CATEGORY_IDS },
    note: { type: "string", description: "Short description, max 60 characters" },
  },
  required: ["is_slip", "type", "amount", "currency", "date", "category", "note"],
  additionalProperties: false,
};

// คำสั่งให้ AI (เขียนเป็นภาษาอังกฤษ เพราะ AI ทำตามคำสั่งภาษาอังกฤษได้แม่นที่สุด)
function buildInstructions(today: string) {
  return `You read photos of Thai bank transfer slips, QR payment slips, receipts and bills for a personal expense tracker.
Today's date is ${today}.

Return the transaction as JSON:
- is_slip: false if the image is not a slip/receipt/bill (then use amount 0, type "expense", category "other", note "").
- amount: the transferred or paid amount (จำนวนเงิน / ยอดชำระ). Ignore fees unless only a total is shown.
- currency: THB unless another currency is clearly shown.
- date: Thai slips often use the Buddhist Era year (e.g. "19 ต.ค. 69" or "2569" means 2026; subtract 543). Use null if no date is visible.
- type: "expense" for payments and transfers the user sent (the usual case). Use "income" only when the slip clearly shows money received (รับเงิน, เงินเข้า) or a salary deposit.
- category for expense: food (meals, drinks, cafes, groceries, convenience stores), transport (taxi, ride-hailing, BTS/MRT, fuel, tolls, parking), housing (rent, condo fees, repairs), bills (electricity การไฟฟ้า, water การประปา, internet, phone, insurance), shopping (clothes, online shops like Shopee/Lazada, household items), health (hospital, clinic, pharmacy), entertainment (movies, streaming, games, concerts), other.
- category for income: salary, side (freelance, selling), other.
- note: in Thai if the slip is Thai, naming the payee or payer, e.g. "โอนให้ ร้านข้าวมันไก่" or "รับโอนจาก สมชาย".`;
}

function error(code: ScanErrorCode, status: number, retryAfter?: number) {
  return Response.json({ error: code, retryAfter }, { status });
}

// ตรวจและปรับคำตอบของ AI ให้เข้ากับข้อมูลในแอปอีกชั้น (ไม่เชื่อ AI 100%)
function normalize(raw: Record<string, unknown>): ScanResult | null {
  if (raw.is_slip !== true) return { isSlip: false };
  const amount = Number(raw.amount);
  if (!(amount > 0)) return null;
  const type = raw.type === "income" ? "income" : "expense";
  const category = typeof raw.category === "string" && isCategoryOf(type, raw.category) ? raw.category : FALLBACK_CATEGORY;
  const date = typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null;
  return {
    isSlip: true,
    transaction: {
      type,
      amount: Math.round(amount * 100) / 100,
      currency: isCurrencyCode(raw.currency) ? raw.currency : DEFAULT_CURRENCY,
      category,
      date,
      note: typeof raw.note === "string" ? raw.note.trim().slice(0, 100) : "",
    },
  };
}

// OpenAI บอกเวลาที่ควรรอ (วินาที) ไว้ใน header "retry-after"
function parseRetryAfter(headers: Headers | undefined) {
  const seconds = Number(headers?.get("retry-after"));
  return seconds > 0 ? seconds : undefined;
}

export async function POST(request: Request) {
  // ต้องล็อกอินก่อน คนนอกจะได้ใช้เครดิต OpenAI ไม่ได้
  if (!(await getCurrentUser().catch(() => null))) return error("unauthorized", 401);
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) return error("no_key", 500);

  // 1) รับรูปจากเบราว์เซอร์
  let image: File;
  let today: string;
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      return error("bad_request", 400);
    }
    image = file;
    const sentToday = form.get("today");
    // ใช้วันที่ของเครื่องผู้ใช้ (เซิร์ฟเวอร์อาจอยู่คนละเขตเวลา)
    today = typeof sentToday === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sentToday) ? sentToday : new Date().toISOString().slice(0, 10);
  } catch {
    return error("bad_request", 400);
  }

  // 2) ส่งให้ OpenAI อ่าน
  try {
    const client = new OpenAI({ apiKey });
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const response = await client.responses.create({
      model: MODEL,
      instructions: buildInstructions(today),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Read this image." },
            { type: "input_image", image_url: `data:${image.type};base64,${base64}`, detail: "high" },
          ],
        },
      ],
      // บังคับให้ตอบเป็น JSON ตาม schema (strict = ได้รูปแบบตรงแน่นอน)
      text: { format: { type: "json_schema", name: "slip", schema: RESPONSE_SCHEMA, strict: true } },
    });

    // 3) แปลงคำตอบเป็นข้อมูล (ถ้าไม่มีข้อความ เช่น ถูกบล็อก ถือว่าอ่านไม่ได้)
    const text = response.output_text;
    if (!text) return error("unreadable", 422);
    const result = normalize(JSON.parse(text));
    if (!result) return error("unreadable", 422);
    return Response.json(result);
  } catch (err) {
    if (err instanceof SyntaxError) return error("unreadable", 422);
    if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) return error("bad_key", 401);
    if (err instanceof OpenAI.RateLimitError) return error("quota", 429, parseRetryAfter(err.headers));
    console.error("scan-slip failed:", err);
    return error("service", 502);
  }
}
