"use client";

import AuthForm from "@/components/AuthForm";
import { api, errorText } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

// ตั้งค่าครั้งแรก: สร้าง admin คนแรก (เซิร์ฟเวอร์ยอมเฉพาะตอนที่ยังไม่มีผู้ใช้เลย)
export default function SetupPage() {
  const { t } = useI18n();
  return (
    <AuthForm
      title={t.setupTitle}
      hint={t.setupHint}
      submitLabel={t.setupButton}
      fields={[
        { name: "displayName", label: "displayName", autoComplete: "name" },
        { name: "username", label: "username", autoComplete: "username" },
        { name: "password", label: "password", type: "password", autoComplete: "new-password" },
      ]}
      errorText={(err) => errorText(t, err)}
      onSubmit={async (v) => {
        await api.setup({ username: v.username ?? "", displayName: v.displayName ?? "", password: v.password ?? "" });
        window.location.href = "/";
      }}
    />
  );
}
