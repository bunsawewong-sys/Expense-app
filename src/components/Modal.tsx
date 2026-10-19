import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// กล่องลอยกลางจอ ใช้ <dialog> ของเบราว์เซอร์: กด Esc ปิดได้ และล็อกหน้าด้านหลังให้เอง
export default function Modal({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // เปิดกล่องทันทีที่ component นี้ถูกแสดง
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // คลิกที่พื้นหลังมืด (นอกกล่อง) = ปิด
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-5">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
