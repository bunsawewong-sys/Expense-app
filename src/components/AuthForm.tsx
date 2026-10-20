import { useState, type FormEvent } from "react";
import { useI18n, type Messages } from "@/lib/i18n";

// ฟอร์มกลางของหน้า login / setup
type Field = { name: string; label: keyof Messages; type?: string; autoComplete: string };

type Props = {
  title: string;
  hint: string;
  fields: Field[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>; // throw = แสดงข้อความ error
  errorText: (err: unknown) => string;
};

export default function AuthForm({ title, hint, fields, submitLabel, onSubmit, errorText }: Props) {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-800";

  return (
    <section className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-sm font-medium">{t[f.label]}</span>
            <input
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className={input}
              required
            />
          </label>
        ))}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
