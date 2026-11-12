"use client";

import { create } from "zustand";

import { CheckIcon, CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }));
    setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API usable from any client event handler. */
export const toast = {
  show: (message: string, action?: Toast["action"]) => useToastStore.getState().push({ message, tone: "default", action }),
  success: (message: string, action?: Toast["action"]) => useToastStore.getState().push({ message, tone: "success", action }),
  error: (message: string) => useToastStore.getState().push({ message, tone: "error" }),
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 md:items-end md:p-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-full py-2 pr-2 pl-5 text-body-sm text-white",
            t.tone === "error" ? "bg-danger" : "bg-ink",
          )}
        >
          {t.tone === "success" ? <CheckIcon size={16} className="shrink-0 text-apricot" /> : null}
          <span className="min-w-0 flex-1 py-1.5">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id);
              }}
              className="shrink-0 rounded-full bg-white/12 px-3.5 py-1.5 text-caption font-medium hover:bg-white/20"
            >
              {t.action.label}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
            className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
