import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/api";

// ใครล็อกอินอยู่ (AppShell เป็นคนโหลด แล้วส่งให้ทุกหน้าผ่าน Context)
// user = null แปลว่ายังไม่ล็อกอิน (หรือกำลังโหลด)
type Session = { user: SessionUser | null; setUser: (user: SessionUser | null) => void };

export const SessionContext = createContext<Session>({ user: null, setUser: () => {} });

export function useSession() {
  return useContext(SessionContext);
}
