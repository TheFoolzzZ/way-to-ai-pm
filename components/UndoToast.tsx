"use client";

import { useEffect } from "react";

type UndoToastProps = {
  open: boolean;
  message: string;
  durationMs?: number;
  onUndo: () => Promise<void> | void;
  onClose: () => void;
};

export default function UndoToast({
  open,
  message,
  durationMs = 4000,
  onUndo,
  onClose,
}: UndoToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      onClose();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[1100] w-[min(92vw,460px)] -translate-x-1/2 rounded-xl border border-white/15 bg-[rgba(8,14,30,0.95)] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">{message}</p>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 text-sm text-primary underline underline-offset-4"
        >
          撤销
        </button>
      </div>
    </div>
  );
}

