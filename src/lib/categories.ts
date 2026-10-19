import type { TransactionType } from "./transactions";

export type Category = {
  id: string;
  icon: string; // emoji ใช้เป็นไอคอน ไม่ต้องลง library เพิ่ม
  name: { th: string; en: string };
};

// หมวดหมู่แยกตามประเภท (รายรับกับรายจ่ายมีหมวดไม่เหมือนกัน)
export const CATEGORIES: Record<TransactionType, Category[]> = {
  expense: [
    { id: "food", icon: "🍜", name: { th: "อาหาร", en: "Food" } },
    { id: "transport", icon: "🚗", name: { th: "เดินทาง", en: "Transport" } },
    { id: "housing", icon: "🏠", name: { th: "ที่พัก/บ้าน", en: "Housing" } },
    { id: "bills", icon: "💡", name: { th: "บิล/สาธารณูปโภค", en: "Bills" } },
    { id: "shopping", icon: "🛍️", name: { th: "ช้อปปิ้ง", en: "Shopping" } },
    { id: "health", icon: "💊", name: { th: "สุขภาพ", en: "Health" } },
    { id: "entertainment", icon: "🎬", name: { th: "บันเทิง", en: "Leisure" } },
    { id: "other", icon: "📦", name: { th: "อื่น ๆ", en: "Other" } },
  ],
  income: [
    { id: "salary", icon: "💼", name: { th: "เงินเดือน", en: "Salary" } },
    { id: "side", icon: "💰", name: { th: "รายได้เสริม", en: "Side income" } },
    { id: "other", icon: "📦", name: { th: "อื่น ๆ", en: "Other" } },
  ],
};

// หมวดสำรอง ใช้กับรายการที่ไม่มีหมวด (เช่น ข้อมูลจากแอปเวอร์ชันแรก)
export const FALLBACK_CATEGORY = "other";

export function isCategoryOf(type: TransactionType, id: string) {
  return CATEGORIES[type].some((c) => c.id === id);
}

export function getCategory(type: TransactionType, id: string): Category {
  const list = CATEGORIES[type];
  return list.find((c) => c.id === id) ?? list.find((c) => c.id === FALLBACK_CATEGORY)!;
}
