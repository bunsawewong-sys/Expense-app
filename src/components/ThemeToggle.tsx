import { useLayoutEffect, useState } from "react";
import { ClockIcon, MoonIcon, SunIcon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";
import { applyTheme, loadThemeMode, saveThemeMode, type ThemeMode } from "@/lib/theme";

// ปุ่มสลับโหมดสี 3 แบบ: อัตโนมัติ / สว่าง / มืด
export default function ThemeToggle() {
  const { t } = useI18n();
  // component นี้แสดงหลังโหลดหน้าเสร็จแล้ว (ดู page.tsx) จึงอ่าน localStorage ได้ตั้งแต่แรก
  const [mode, setMode] = useState<ThemeMode>(loadThemeMode);

  // useLayoutEffect = ทำก่อนหน้าจอวาดใหม่ จะได้ไม่กะพริบ
  useLayoutEffect(() => {
    applyTheme(mode);
    saveThemeMode(mode);
    if (mode !== "auto") return;
    // โหมดอัตโนมัติ: เช็กเวลาทุก 1 นาที เผื่อเปิดแอปค้างไว้ข้าม 06:00 หรือ 18:00
    const timer = setInterval(() => applyTheme("auto"), 60_000);
    return () => clearInterval(timer);
  }, [mode]);

  const options = [
    { value: "auto", label: t.themeAuto, icon: <ClockIcon className="h-4 w-4" />, hint: t.themeAutoHint },
    { value: "light", label: t.themeLight, icon: <SunIcon className="h-4 w-4" /> },
    { value: "dark", label: t.themeDark, icon: <MoonIcon className="h-4 w-4" /> },
  ] as const;

  return (
    <div role="group" aria-label={t.theme} className="inline-flex rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setMode(o.value)}
          aria-pressed={mode === o.value}
          title={"hint" in o ? o.hint : o.label}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
            mode === o.value
              ? "bg-brand text-white"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
