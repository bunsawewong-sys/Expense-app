"use client"; // ใช้ localStorage และ state จึงต้องทำงานในเบราว์เซอร์

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChartIcon, ListIcon, LogoutIcon, UsersIcon } from "@/components/Icons";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { ApiError, api, type SessionUser } from "@/lib/api";
import { I18nContext, MESSAGES, loadLang, saveLang, type Lang } from "@/lib/i18n";
import { SessionContext } from "@/lib/session";

// หน้าที่เปิดได้โดยไม่ต้องล็อกอิน
const PUBLIC_PAGES = ["/login", "/setup"];

// กรอบที่ทุกหน้าใช้ร่วมกัน (ใส่ไว้ใน layout.tsx): ดูแลภาษา + ผู้ใช้ที่ล็อกอิน + ส่วนหัว + เมนู
// สลับหน้าแล้วส่วนนี้ไม่ถูกโหลดใหม่ ภาษาและข้อมูลผู้ใช้จึงใช้ร่วมกันทุกหน้า
export default function AppShell({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PAGES.includes(pathname);

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

  // ถามเซิร์ฟเวอร์ว่าใครล็อกอินอยู่ (ทุกครั้งที่เปลี่ยนหน้า เผื่อ session หมดอายุ)
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => {
        if (cancelled) return;
        setUser(user);
        if (isPublic) router.replace("/"); // ล็อกอินแล้ว ไม่ต้องอยู่หน้า login
        else if (pathname.startsWith("/admin") && user.role !== "admin") router.replace("/");
      })
      .catch((err) => {
        if (cancelled) return;
        setUser(null);
        const needsSetup = err instanceof ApiError && err.body.needsSetup === true;
        if (needsSetup && pathname !== "/setup") router.replace("/setup");
        else if (!needsSetup && !isPublic) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, isPublic, router]);

  async function logout() {
    await api.logout().catch(() => {});
    setUser(null);
    router.replace("/login");
  }

  const t = MESSAGES[lang];

  const nav = [
    { href: "/", label: t.navTransactions, icon: <ListIcon className="h-4 w-4" /> },
    { href: "/summary", label: t.navSummary, icon: <ChartIcon className="h-4 w-4" /> },
    ...(user?.role === "admin" ? [{ href: "/admin/users", label: t.navUsers, icon: <UsersIcon className="h-4 w-4" /> }] : []),
  ];

  return (
    <I18nContext value={{ lang, t, setLang }}>
      <SessionContext value={{ user, setUser }}>
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

            {/* เมนู + ผู้ใช้ที่ล็อกอิน (ไม่แสดงในหน้า login/setup) */}
            {!isPublic && user && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <nav className="inline-flex flex-wrap rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
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

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{user.displayName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-brand/10 text-brand dark:bg-brand/20"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {user.role === "admin" ? t.roleAdmin : t.roleUser}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <LogoutIcon className="h-4 w-4" />
                    {t.logout}
                  </button>
                </div>
              </div>
            )}
          </header>

          {children}
        </main>
      </SessionContext>
    </I18nContext>
  );
}
