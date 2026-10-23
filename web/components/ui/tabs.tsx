"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts must be used inside <Tabs>");
  return ctx;
}

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

function Tabs({ value, defaultValue = "", onValueChange, className, children }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const setValue = React.useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function TabsList({ className, children, onKeyDown, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "flex w-fit gap-1 rounded-[6px] border-2 border-[#0b0b0b] bg-[#efece2] p-1 shadow-[3px_3px_0px_0px_#0b0b0b]",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        const tabs = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
        );
        const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
        if (index === -1) return;
        event.preventDefault();
        const next =
          event.key === "ArrowRight"
            ? tabs[(index + 1) % tabs.length]
            : tabs[(index - 1 + tabs.length) % tabs.length];
        next?.focus();
        next?.click();
      }}
      {...props}
    >
      {children}
    </div>
  );
});
TabsList.displayName = "TabsList";

interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  function TabTrigger({ className, value, children, onClick, ...props }, ref) {
    const ctx = useTabs();
    const selected = ctx.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        className={cn(
          "relative rounded-[4px] border-2 px-4 py-2 text-sm font-bold uppercase tracking-[0.04em] transition-[box-shadow,background-color,color] duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6ff00]",
          selected
            ? "border-[#0b0b0b] bg-white text-[#0b0b0b] shadow-[3px_3px_0px_0px_#0b0b0b]"
            : "border-transparent text-[#3a3a3a] hover:bg-white/60 hover:text-[#0b0b0b]",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          ctx.setValue(value);
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);
TabTrigger.displayName = "TabTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ className, value, children, ...props }, ref) {
    const ctx = useTabs();
    if (ctx.value !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn("mt-4 focus-visible:outline-2 focus-visible:outline-[#e6ff00]", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabTrigger, TabsContent };
