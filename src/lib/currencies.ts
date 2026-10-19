// สกุลเงินที่เลือกได้ (สัญลักษณ์ไม่ซ้ำกัน จะได้แยก $ กับ S$, ¥ กับ CN¥ ออก)
export const CURRENCIES = [
  { code: "THB", symbol: "฿", decimals: 2, name: { th: "บาท", en: "Thai Baht" } },
  { code: "USD", symbol: "$", decimals: 2, name: { th: "ดอลลาร์สหรัฐ", en: "US Dollar" } },
  { code: "EUR", symbol: "€", decimals: 2, name: { th: "ยูโร", en: "Euro" } },
  { code: "JPY", symbol: "¥", decimals: 0, name: { th: "เยน", en: "Japanese Yen" } },
  { code: "CNY", symbol: "CN¥", decimals: 2, name: { th: "หยวน", en: "Chinese Yuan" } },
  { code: "SGD", symbol: "S$", decimals: 2, name: { th: "ดอลลาร์สิงคโปร์", en: "Singapore Dollar" } },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "THB";

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

export function getCurrency(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

// 1234.5, "THB" → "฿1,234.50"   |   -500, "JPY" → "-¥500"
export function formatMoney(amount: number, code: CurrencyCode) {
  const { symbol, decimals } = getCurrency(code);
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}${symbol}${number}`;
}
