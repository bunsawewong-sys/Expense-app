import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CameraIcon, ImageIcon, PencilIcon, XIcon } from "@/components/Icons";
import Modal from "@/components/Modal";
import TransactionForm from "@/components/TransactionForm";
import { getCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/currencies";
import { useI18n } from "@/lib/i18n";
import { SCAN_ERROR_MESSAGE, runWithLimit, scanSlip, type ScanErrorCode } from "@/lib/scanSlip";
import { formatDate, todayString, type TransactionInput } from "@/lib/transactions";

// สลิป 1 ใบในกล่องตรวจ
type Item = {
  id: number;
  preview: string; // ลิงก์รูปย่อ (สร้างจากไฟล์ในเครื่อง)
  status: "queued" | "reading" | "waiting" | "done" | "not_slip" | "error";
  error?: ScanErrorCode;
  transaction?: TransactionInput;
};

const BUSY: Item["status"][] = ["queued", "reading", "waiting"];

// ปุ่มสแกนสลิป + กล่อง "ตรวจรายการจากสลิป"
export default function SlipScanner({ onSave }: { onSave: (items: TransactionInput[]) => void }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // เลขรอบการสแกน: ปิดกล่องแล้วเลขจะเปลี่ยน ผลที่อ่านเสร็จทีหลังจะถูกทิ้ง
  const round = useRef(0);
  const cameraInput = useRef<HTMLInputElement>(null);
  const pickInput = useRef<HTMLInputElement>(null);

  // ออกจากหน้านี้ระหว่างสแกน → หยุดรับผล
  useEffect(() => () => void round.current++, []);

  function update(id: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].filter((f) => f.type.startsWith("image/"));
    event.target.value = ""; // ล้างค่า จะได้เลือกรูปเดิมซ้ำได้
    if (files.length === 0) return;

    const myRound = ++round.current;
    const today = todayString();
    const jobs = files.map((file, i) => ({ file, id: Date.now() + i }));
    setItems(jobs.map(({ file, id }) => ({ id, preview: URL.createObjectURL(file), status: "queued" })));
    setEditingId(null);
    setOpen(true);

    // อ่านทีละไม่เกิน 2 ใบพร้อมกัน (โควต้าฟรีต่อนาทีมีจำกัด)
    await runWithLimit(jobs, 2, async ({ file, id }) => {
      if (round.current !== myRound) return;
      update(id, { status: "reading" });
      const outcome = await scanSlip(file, today, () => {
        if (round.current === myRound) update(id, { status: "waiting" });
      });
      if (round.current !== myRound) return;
      if (!outcome.ok) update(id, { status: "error", error: outcome.error });
      else if (!outcome.result.isSlip) update(id, { status: "not_slip" });
      else {
        const tx = outcome.result.transaction;
        update(id, { status: "done", transaction: { ...tx, date: tx.date ?? today } });
      }
    });
  }

  function close() {
    round.current++;
    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems([]);
    setEditingId(null);
    setOpen(false);
  }

  function remove(id: number) {
    const item = items.find((it) => it.id === id);
    if (item) URL.revokeObjectURL(item.preview);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const ready = items.filter((it) => it.status === "done" && it.transaction);
  const finished = items.filter((it) => !BUSY.includes(it.status)).length;
  const busy = finished < items.length;
  const editing = items.find((it) => it.id === editingId && it.transaction);

  function saveAll() {
    onSave(ready.map((it) => it.transaction!));
    close();
  }

  const pickButton =
    "flex items-center justify-center gap-2 rounded-lg border border-brand/40 bg-brand/5 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10 dark:bg-brand/10 dark:hover:bg-brand/20";

  return (
    <div className="mb-5 space-y-2 border-b border-slate-100 pb-5 dark:border-slate-800">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => cameraInput.current?.click()} className={pickButton}>
          <CameraIcon className="h-5 w-5" />
          {t.scanCamera}
        </button>
        <button type="button" onClick={() => pickInput.current?.click()} className={pickButton}>
          <ImageIcon className="h-5 w-5" />
          {t.scanPick}
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t.scanHint}</p>

      {/* ช่องเลือกไฟล์ที่ซ่อนไว้: capture="environment" = เปิดกล้องหลังบนมือถือ */}
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={handleFiles} />
      <input ref={pickInput} type="file" accept="image/*" multiple hidden onChange={handleFiles} />

      {open && (
        <Modal title={editing ? t.scanEditTitle : t.scanReviewTitle} onClose={close} dismissible={false}>
          {editing ? (
            <TransactionForm
              key={editing.id}
              initial={editing.transaction}
              submitLabel={t.save}
              onSubmit={(input) => {
                update(editing.id, { transaction: input });
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.scanProgress} {finished}/{items.length} · {t.scanAiGuess}
              </p>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((it) => (
                  <ScanRow
                    key={it.id}
                    item={it}
                    onEdit={() => setEditingId(it.id)}
                    onRemove={() => remove(it.id)}
                  />
                ))}
              </ul>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={busy || ready.length === 0}
                  className="flex-1 rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t.scanSaveAll} ({ready.length})
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// แถวของสลิป 1 ใบ: รูปย่อ + ผลที่อ่านได้ (หรือสถานะ) + ปุ่ม
function ScanRow({ item, onEdit, onRemove }: { item: Item; onEdit: () => void; onRemove: () => void }) {
  const { t, lang } = useI18n();
  const tx = item.transaction;
  const isIncome = tx?.type === "income";
  const category = tx ? getCategory(tx.type, tx.category) : null;
  const color = isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

  return (
    <li className="flex items-center gap-3 py-2.5">
      {/* รูปจากไฟล์ในเครื่อง ใช้แท็ก img ธรรมดาได้เลย */}
      <img src={item.preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />

      <div className="min-w-0 flex-1 text-sm">
        {item.status === "done" && tx && category ? (
          <>
            {/* ยอดเงินอยู่บรรทัดแรก ข้อความจะได้ไม่ถูกบีบบนจอแคบ */}
            <p className={`font-semibold ${color}`}>
              {isIncome ? "+" : "−"}
              {formatMoney(tx.amount, tx.currency)}
            </p>
            <p className="truncate font-medium">
              {category.icon} {category.name[lang]} · {isIncome ? t.income : t.expense}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {formatDate(tx.date, lang)}
              {tx.note && ` · ${tx.note}`}
            </p>
          </>
        ) : item.status === "reading" || item.status === "waiting" ? (
          <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            {item.status === "reading" ? t.scanReading : t.scanWaiting}
          </p>
        ) : item.status === "queued" ? (
          <p className="text-slate-400">{t.scanQueued}</p>
        ) : item.status === "not_slip" ? (
          <p className="text-amber-600 dark:text-amber-400">{t.scanNotSlip}</p>
        ) : (
          <p className="text-rose-600 dark:text-rose-400">{t[SCAN_ERROR_MESSAGE[item.error ?? "service"]]}</p>
        )}
      </div>

      <div className="flex shrink-0">
        {item.status === "done" && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={t.edit}
            title={t.edit}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand dark:hover:bg-slate-800"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.scanRemove}
          title={t.scanRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

