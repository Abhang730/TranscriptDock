"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type AccordionType = "single" | "multiple";

interface AccordionProps {
  /** "single" closes the previous item; "multiple" keeps several open. */
  type?: AccordionType;
  /** Uncontrolled initial open value(s). */
  defaultValue?: string | string[];
  /** Controlled open value(s). */
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children: React.ReactNode;
}

interface AccordionState {
  type: AccordionType;
  openValues: string[];
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionState | null>(null);
const AccordionItemContext = React.createContext<string | null>(null);

function useAccordion(): AccordionState {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion parts must be used inside <Accordion>");
  return ctx;
}

function useAccordionItem(): string {
  const value = React.useContext(AccordionItemContext);
  if (value === null) {
    throw new Error("Accordion parts must be used inside <AccordionItem>");
  }
  return value;
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function Accordion({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const [internal, setInternal] = React.useState<string[]>(() =>
    toArray(defaultValue),
  );
  const controlled = value !== undefined;
  const openValues = controlled ? toArray(value) : internal;

  const toggle = React.useCallback(
    (next: string) => {
      const isOpen = openValues.includes(next);
      let updated: string[];
      if (type === "single") {
        updated = isOpen ? [] : [next];
      } else {
        updated = isOpen
          ? openValues.filter((item) => item !== next)
          : [...openValues, next];
      }
      if (!controlled) setInternal(updated);
      onValueChange?.(type === "single" ? (updated[0] ?? "") : updated);
    },
    [controlled, onValueChange, openValues, type],
  );

  return (
    <AccordionContext.Provider value={{ type, openValues, toggle }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div
        className={cn("border-b-2 border-[#0b0b0b]", className)}
        data-state={
          useAccordion().openValues.includes(value) ? "open" : "closed"
        }
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function AccordionTrigger({ className, children, onClick, ...props }, ref) {
  const accordion = useAccordion();
  const value = useAccordionItem();
  const isOpen = accordion.openValues.includes(value);
  const panelId = `accordion-panel-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const triggerId = `accordion-trigger-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <button
      ref={ref}
      type="button"
      id={triggerId}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={cn(
        "flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-bold text-[#0b0b0b] transition-colors hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6ff00] rounded-sm",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        accordion.toggle(value);
      }}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        aria-hidden
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          isOpen ? "rotate-180" : "",
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function AccordionContent({ className, children, ...props }, ref) {
  const accordion = useAccordion();
  const value = useAccordionItem();
  const isOpen = accordion.openValues.includes(value);
  const panelId = `accordion-panel-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const triggerId = `accordion-trigger-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <div
      ref={ref}
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!isOpen}
      className={cn("pb-4 text-sm text-[#3a3a3a] leading-relaxed", className)}
      {...props}
    >
      {isOpen ? children : null}
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
