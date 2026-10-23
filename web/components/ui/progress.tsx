import * as React from "react";
import { cn } from "@/lib/cn";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  label?: string;
  variant?: "accent" | "blue" | "ink";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 1, label, variant = "accent", ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {(label || variant !== "ink") && (
          <div className="flex justify-between text-[0.75rem] font-bold uppercase tracking-[0.04em] text-[#3a3a3a] mb-1.5">
            {label && <span>{label}</span>}
            {variant !== "ink" && <span className="tabular-nums">{Math.round(pct)}%</span>}
          </div>
        )}
        <div className="border-2 border-[#0b0b0b] bg-[#efece2] shadow-[3px_3px_0px_0px_#0b0b0b] rounded-[4px] h-5 overflow-hidden">
          <div
            className={cn(
              "h-full bg-no-repeat transition-[width] duration-300",
              variant === "accent" && "bg-[#e6ff00]",
              variant === "blue" && "bg-[#1a46ff]",
              variant === "ink" && "bg-[#0b0b0b]",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
