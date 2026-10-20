import { PinIcon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";
import { locationLabel, mapsUrl } from "@/lib/location";
import type { TransactionLocation } from "@/lib/transactions";

// 📍 ชื่อสถานที่ กดแล้วเปิด Google Maps ในแท็บใหม่ (ไม่มีตำแหน่ง = ไม่แสดงอะไร)
export default function LocationLink({ location }: { location?: TransactionLocation | null }) {
  const { t } = useI18n();
  const label = location ? locationLabel(location) : "";
  if (!location || !label) return null;
  return (
    <a
      href={mapsUrl(location)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${label} · ${t.viewMap}`} // ชื่อยาวถูกตัดด้วย … ชี้เมาส์แล้วเห็นเต็ม
      className="inline-flex max-w-full items-center gap-1 text-xs text-slate-500 hover:text-brand hover:underline dark:text-slate-400"
    >
      <PinIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}
