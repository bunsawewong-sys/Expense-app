import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import InlineScript from "@/components/InlineScript";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// ฟอนต์ภาษาไทยจาก Google Fonts (Next.js ดาวน์โหลดมาเก็บไว้ในแอปให้เอง)
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
});

// ชื่อบนแท็บเบราว์เซอร์ตั้งใน page.tsx (เปลี่ยนตามภาษาที่เลือก)
export const metadata: Metadata = {
  description: "แอปบันทึกรายรับรายจ่ายส่วนตัว",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: สคริปต์ด้านล่างเปลี่ยน data-theme/lang ก่อน React เริ่มทำงาน ให้ React ยอมรับค่านั้น
    <html lang="th" data-theme="light" suppressHydrationWarning className={`${notoSansThai.variable} h-full antialiased`}>
      <head>
        {/* เลือกโหมดสีก่อนหน้าเว็บแสดงผล จะได้ไม่เห็นหน้าขาวแวบก่อนเปลี่ยนเป็นมืด */}
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body className="min-h-full bg-slate-50 font-sans text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
