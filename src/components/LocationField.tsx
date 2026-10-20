import { useEffect, useEffectEvent, useRef, useState } from "react";
import { LocateIcon, PinIcon, XIcon } from "@/components/Icons";
import { useI18n, type Messages } from "@/lib/i18n";
import { getCurrentLocation, hasCoords, locationLabel, mapsUrl, type LocateError } from "@/lib/location";
import type { TransactionLocation } from "@/lib/transactions";

type Props = {
  value: TransactionLocation | null;
  onChange: (location: TransactionLocation | null) => void;
  locateSignal: number; // เปลี่ยนเลขเมื่อไร = หาตำแหน่งใหม่ (0 = ยังไม่ต้องหา)
};

type Status = "idle" | "locating" | "gps_only" | LocateError;

const ERROR_TEXT: Record<LocateError, keyof Messages> = {
  denied: "locationDenied",
  unavailable: "locationUnavailable",
  timeout: "locationTimeout",
  unsupported: "locationUnsupported",
};

// ช่องตำแหน่งในฟอร์ม: หาจาก GPS ให้อัตโนมัติ แก้ชื่อเองได้ หรือกด ✕ ไม่ระบุก็ได้
export default function LocationField({ value, onChange, locateSignal }: Props) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  // เลขคำขอล่าสุด: ถ้าผู้ใช้พิมพ์เอง/กด ✕ ระหว่างรอ ผลที่มาทีหลังจะถูกทิ้ง
  const request = useRef(0);

  async function locate() {
    const id = ++request.current;
    setStatus("locating");
    const result = await getCurrentLocation(lang);
    if (id !== request.current) return;
    if (result.ok) {
      onChange(result.location);
      setStatus(result.location.name ? "idle" : "gps_only");
    } else {
      setStatus(result.error); // ไม่ได้ตำแหน่ง: เก็บค่าเดิมไว้ ยังบันทึกได้ตามปกติ
    }
  }

  // useEffectEvent = ใช้ค่าล่าสุดของ lang/onChange ได้ โดยไม่ทำให้หาตำแหน่งซ้ำทุกครั้งที่ค่าพวกนี้เปลี่ยน
  const onSignal = useEffectEvent(() => void locate());
  useEffect(() => {
    if (locateSignal > 0) onSignal();
  }, [locateSignal]);
  useEffect(() => () => void request.current++, []); // ปิดฟอร์มแล้ว ไม่ต้องรับผล

  function type(text: string) {
    request.current++;
    if (status === "locating") setStatus("idle");
    const name = text.slice(0, 120);
    // แก้ชื่อแต่พิกัดเดิมยังอยู่ / ไม่มีพิกัดและลบชื่อหมด = ไม่ระบุตำแหน่ง
    if (value && hasCoords(value)) onChange({ ...value, name });
    else onChange(name.trim() ? { name } : null);
  }

  function clear() {
    request.current++;
    setStatus("idle");
    onChange(null);
  }

  const iconButton =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800";

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{t.location}</span>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <PinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value?.name ?? ""}
            onChange={(e) => type(e.target.value)}
            // มีพิกัดแต่ไม่มีชื่อ: แสดงพิกัดเป็นตัวอย่างในช่องว่าง
            placeholder={value && !value.name ? locationLabel(value) : t.locationPlaceholder}
            maxLength={120}
            aria-label={t.location}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <button type="button" onClick={locate} disabled={status === "locating"} aria-label={t.locationRefresh} title={t.locationRefresh} className={`${iconButton} hover:text-brand`}>
          {status === "locating" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          ) : (
            <LocateIcon />
          )}
        </button>
        {value && (
          <button type="button" onClick={clear} aria-label={t.locationClear} title={t.locationClear} className={`${iconButton} hover:text-rose-600`}>
            <XIcon />
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {status === "locating" ? (
          t.locating
        ) : status !== "idle" && status !== "gps_only" ? (
          <span className="text-amber-600 dark:text-amber-400">{t[ERROR_TEXT[status]]}</span>
        ) : value ? (
          <>
            {status === "gps_only" && !value.name
              ? `${t.locationGpsOnly} · `
              : value.accuracy !== undefined && `${t.locationAccuracy.replace("{n}", String(value.accuracy))} · `}
            <a href={mapsUrl(value)} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              {t.viewMap}
            </a>
          </>
        ) : (
          t.locationNone
        )}
      </p>
    </div>
  );
}
