// ด่านแรก (Next.js 16 เรียกว่า Proxy เดิมชื่อ Middleware):
// ถ้ายังไม่มี cookie ล็อกอิน → พาไปหน้า /login
// ส่วนการตรวจสิทธิ์จริง (session ยังใช้ได้ไหม / เป็น admin ไหม) ทำที่ API ทุกตัว
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGES = ["/login", "/setup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PAGES.includes(pathname) || request.cookies.has("session")) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

// ใช้กับหน้าเว็บเท่านั้น (ไม่รวม API, ไฟล์ของ Next.js และไฟล์ static)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
