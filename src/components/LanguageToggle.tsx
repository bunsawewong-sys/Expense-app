import { useI18n, type Lang } from "@/lib/i18n";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "EN" },
];

// ปุ่มสลับภาษา ไทย / English
export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div role="group" aria-label={t.language} className="inline-flex rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            lang === o.value
              ? "bg-brand text-white"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
