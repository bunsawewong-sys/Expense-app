"use client"; // ใช้ localStorage และ state จึงต้องทำงานในเบราว์เซอร์

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChartIcon, ListIcon } from "@/components/Icons";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { I18nContext, MESSAGES, loadLang, saveLang, type Lang } from "@/lib/i18n";

// กรอบที่ทุกหน้าใช้ร่วมกัน (ใส่ไว้ใน layout.tsx): ดูแลภาษา + ส่วนหัว + เมนู
// สลับหน้าแล้วส่วนนี้ไม่ถูกโหลดใหม่ ภาษาที่เลือกจึงใช้ร่วมกันทุกหน้า
export default function AppShell({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  // เปิดเว็บครั้งแรก → อ่านภาษาที่เลือกไว้
  useEffect(() => {
    setLang(loadLang());
    setReady(true);
  }, []);

  // เปลี่ยนภาษา → จำค่าไว้ และบอกเบราว์เซอร์ว่าหน้านี้เป็นภาษาอะไร
  useEffect(() => {
    if (!ready) return;
    saveLang(lang);
    document.documentElement.lang = lang;
  }, [lang, ready]);

  const t = MESSAGES[lang];

  const nav = [
    { href: "/", label: t.navTransactions, icon: <ListIcon className="h-4 w-4" /> },
    { href: "/summary", label: t.navSummary, icon: <ChartIcon className="h-4 w-4" /> },
  ];

  return (
    <I18nContext value={{ lang, t, setLang }}>
      {/* ชื่อบนแท็บเบราว์เซอร์ (React ย้ายแท็ก <title> ไปไว้ใน <head> ให้เอง) */}
      <title>{t.appTitle}</title>

      {/* ระหว่างโหลด: วงกลมหมุนลอยทับ และซ่อนเนื้อหาไว้ (กันข้อความไทยแวบขึ้นมาก่อนเปลี่ยนเป็นอังกฤษ)
          เนื้อหา ({children}) ต้องถูกวาดเสมอ Next.js จะได้ตรวจหน้าได้ครบ */}
      {!ready && (
        <div className="fixed inset-0 flex items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      )}

      <main className={`mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8 ${ready ? "" : "invisible"}`}>
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-brand sm:text-3xl">{t.appTitle}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.appSubtitle}</p>
            </div>
            {/* ปุ่มสองตัวนี้อ่านค่าจาก localStorage จึงแสดงหลังโหลดเสร็จ (ฝั่งเซิร์ฟเวอร์ไม่มี localStorage) */}
            {ready && (
              <div className="flex flex-wrap gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* เมนูสลับหน้า */}
          <nav className="inline-flex rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-brand text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}
      </main>
    </I18nContext>
  );
}
