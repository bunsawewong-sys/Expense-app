"use client";

import AuthForm from "@/components/AuthForm";
import { api, errorText } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

// หน้าเข้าสู่ระบบ
export default function LoginPage() {
  const { t } = useI18n();
  return (
    <AuthForm
      title={t.loginTitle}
      hint={t.loginHint}
      submitLabel={t.loginButton}
      fields={[
        { name: "username", label: "username", autoComplete: "username" },
        { name: "password", label: "password", type: "password", autoComplete: "current-password" },
      ]}
      errorText={(err) => errorText(t, err)}
      onSubmit={async (v) => {
        await api.login(v.username ?? "", v.password ?? "");
        window.location.href = "/"; // โหลดหน้าใหม่ทั้งหมด จะได้เริ่มจากข้อมูลของคนที่ล็อกอิน
      }}
    />
  );
}
