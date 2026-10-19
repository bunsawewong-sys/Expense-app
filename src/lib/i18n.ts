import { createContext, useContext } from "react";

export type Lang = "th" | "en";

// ข้อความทุกจุดบนหน้าจอ: เพิ่ม/แก้ข้อความที่นี่ที่เดียว
const th = {
  appTitle: "บันทึกรายรับรายจ่าย",
  appSubtitle: "ข้อมูลทั้งหมดเก็บไว้ในเบราว์เซอร์เครื่องนี้",
  income: "รายรับ",
  expense: "รายจ่าย",
  totalIncome: "รายรับรวม",
  totalExpense: "รายจ่ายรวม",
  balance: "คงเหลือ",
  currency: "สกุลเงิน",
  addTitle: "เพิ่มรายการ",
  addButton: "เพิ่มรายการ",
  editTitle: "แก้ไขรายการ",
  save: "บันทึก",
  cancel: "ยกเลิก",
  edit: "แก้ไข",
  delete: "ลบ",
  type: "ประเภท",
  category: "หมวดหมู่",
  amount: "จำนวนเงิน",
  date: "วันที่",
  note: "หมายเหตุ",
  notePlaceholder: "ไม่บังคับ เช่น ข้าวมันไก่ร้านประจำ",
  errorDate: "กรุณาเลือกวันที่",
  errorCategory: "กรุณาเลือกหมวดหมู่",
  errorAmount: "จำนวนเงินต้องมากกว่า 0",
  historyTitle: "ประวัติรายการ",
  empty: "ยังไม่มีรายการ ลองเพิ่มรายการแรกจากฟอร์มดูสิ",
  today: "วันนี้",
  yesterday: "เมื่อวาน",
  dayIncome: "รับ",
  dayExpense: "จ่าย",
  dayBalance: "คงเหลือ",
  deleteTitle: "ลบรายการนี้?",
  deleteHint: "ลบแล้วจะกู้คืนไม่ได้",
  theme: "โหมดสี",
  themeAuto: "อัตโนมัติ",
  themeAutoHint: "06:00–18:00 โหมดสว่าง, 18:00–06:00 โหมดมืด",
  themeLight: "สว่าง",
  themeDark: "มืด",
  language: "ภาษา",
};

export type Messages = typeof th;

const en: Messages = {
  appTitle: "Expense Tracker",
  appSubtitle: "All data is stored in this browser",
  income: "Income",
  expense: "Expense",
  totalIncome: "Total income",
  totalExpense: "Total expenses",
  balance: "Balance",
  currency: "Currency",
  addTitle: "New transaction",
  addButton: "Add",
  editTitle: "Edit transaction",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  type: "Type",
  category: "Category",
  amount: "Amount",
  date: "Date",
  note: "Note",
  notePlaceholder: "Optional, e.g. lunch with the team",
  errorDate: "Please pick a date",
  errorCategory: "Please choose a category",
  errorAmount: "Amount must be greater than 0",
  historyTitle: "History",
  empty: "No transactions yet. Add your first one with the form.",
  today: "Today",
  yesterday: "Yesterday",
  dayIncome: "In",
  dayExpense: "Out",
  dayBalance: "Net",
  deleteTitle: "Delete this transaction?",
  deleteHint: "This can't be undone.",
  theme: "Theme",
  themeAuto: "Auto",
  themeAutoHint: "Light 06:00–18:00, dark 18:00–06:00",
  themeLight: "Light",
  themeDark: "Dark",
  language: "Language",
};

export const MESSAGES: Record<Lang, Messages> = { th, en };

const LANG_KEY = "expense-tracker:lang";

export function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "th";
  } catch {
    return "th";
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // บันทึกไม่ได้ก็ไม่เป็นไร แค่ครั้งหน้าจะกลับเป็นภาษาไทย
  }
}

// Context = "กล่องกลาง" ที่ทุก component หยิบภาษาปัจจุบันไปใช้ได้ โดยไม่ต้องส่งต่อกันทีละชั้น
type I18n = { lang: Lang; t: Messages; setLang: (lang: Lang) => void };

export const I18nContext = createContext<I18n>({ lang: "th", t: th, setLang: () => {} });

export function useI18n() {
  return useContext(I18nContext);
}
