"use client";

// สคริปต์ที่ต้องรันตอนโหลดหน้าครั้งแรกเท่านั้น (ตามคู่มือ Next.js: preventing-flash-before-hydration)
// ฝั่งเซิร์ฟเวอร์ใส่ type="text/javascript" ให้เบราว์เซอร์รัน ฝั่ง React ในเบราว์เซอร์ใส่ "text/plain"
// React จะได้ไม่เตือนว่าเจอ <script> ระหว่างวาดหน้าจอ
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
