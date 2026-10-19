// โหมดที่ผู้ใช้เลือก: อัตโนมัติ (ตามเวลา) / สว่าง / มืด
export type ThemeMode = "auto" | "light" | "dark";

const THEME_KEY = "expense-tracker:theme";

// 06:00–17:59 = กลางวัน (สว่าง), 18:00–05:59 = กลางคืน (มืด)
export function resolveTheme(mode: ThemeMode, now = new Date()): "light" | "dark" {
  if (mode !== "auto") return mode;
  const hour = now.getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export function loadThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : "auto";
  } catch {
    return "auto";
  }
}

export function saveThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // บันทึกไม่ได้ก็ใช้ต่อได้ แค่ครั้งหน้าจะกลับเป็นอัตโนมัติ
  }
}

// สลับสีทั้งหน้า: CSS ใน globals.css ดูค่า data-theme ที่ <html>
export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
}

// สคริปต์นี้ใส่ไว้ใน <head> (ดู layout.tsx) ให้รันก่อนหน้าเว็บแสดงผล
// จะได้ไม่เห็นหน้าขาวแวบก่อนเปลี่ยนเป็นมืด (ต้องเขียนเป็นข้อความ เพราะรันก่อน React พร้อม)
export const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem("${THEME_KEY}");var h=new Date().getHours();var t=m==="light"||m==="dark"?m:(h>=6&&h<18?"light":"dark");document.documentElement.setAttribute("data-theme",t);if(localStorage.getItem("expense-tracker:lang")==="en")document.documentElement.lang="en"}catch(e){}})()`;
