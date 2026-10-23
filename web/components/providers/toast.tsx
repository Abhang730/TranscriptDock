"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    [],
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed right-5 bottom-5 z-[100] flex max-h-[80vh] flex-col-reverse gap-3 overflow-y-auto pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  React.useEffect(() => {
    const duration = toast.duration ?? 6000;
    if (duration <= 0) return;
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto w-80 overflow-hidden rounded-[6px] border-2 border-[#0b0b0b] bg-white shadow-[8px_8px_0px_0px_#0b0b0b] p-4 text-sm flex gap-3 transition-[transform] duration-150",
        toast.variant === "success" && "border-l-4 border-l-[#e6ff00]",
        toast.variant === "warning" && "border-l-4 border-l-[#7a4d00]",
        toast.variant === "danger" && "border-l-4 border-l-[#d22b2b]",
        toast.variant === "info" && "border-l-4 border-l-[#1a46ff]",
      )}
    >
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-bold uppercase tracking-[0.04em] text-[#0b0b0b]">
            {toast.title}
          </p>
        )}
        {toast.description && (
          <p className="mt-1 text-[#3a3a3a] leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        className="shrink-0 h-7 w-7 flex items-center justify-center rounded border-2 border-[#0b0b0b] bg-[#efece2] text-[#0b0b0b] hover:bg-white active:translate-x-px active:translate-y-px"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}
