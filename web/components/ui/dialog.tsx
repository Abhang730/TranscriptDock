"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog(): DialogContextValue {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog parts must be used inside <Dialog>");
  return ctx;
}

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({
  className,
  children,
  open = false,
  onOpenChange,
  ...props
}: DialogProps) {
  const handleOpenChange = React.useCallback(
    (next: boolean) => onOpenChange?.(next),
    [onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className={cn("relative", className)} {...props}>
        {children}
      </div>
    </DialogContext.Provider>
  );
}

function DialogOverlay({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = useDialog();
  if (!open) return null;

  return (
    <div
      aria-hidden
      className={cn("fixed inset-0 z-50 bg-black/60", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = useDialog();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] border-2 border-[#0b0b0b] bg-white p-5 shadow-[10px_10px_0px_0px_#0b0b0b] outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <button
        type="button"
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded border-2 border-[#0b0b0b] bg-white text-[#0b0b0b] shadow-[2px_2px_0px_0px_#0b0b0b] hover:bg-[#efece2] active:translate-x-px active:translate-y-px"
        onClick={() => onOpenChange(false)}
        aria-label="Close dialog"
      >
        <X size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pb-4", className)} {...props} />;
}
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <h2
      ref={ref}
      className={cn(
        "text-xl font-extrabold tracking-[-0.02em] leading-tight text-[#0b0b0b]",
        className,
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-[#6b6b6b]", className)}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-5 flex justify-end gap-3 pt-2", className)}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
