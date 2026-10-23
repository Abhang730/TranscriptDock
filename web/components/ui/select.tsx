import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, label, id, children, ...props }, ref) {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;

    return (
      <div className="relative w-full">
        {label ? (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-[0.04em] leading-none text-[#0b0b0b]"
          >
            {label}
          </label>
        ) : null}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full cursor-pointer appearance-none rounded-[4px] border-2 border-[#0b0b0b] bg-white px-3.5 py-2.5 pr-9 text-sm text-[#0b0b0b] shadow-[3px_3px_0px_0px_#0b0b0b] outline-none transition-[box-shadow,transform] duration-75",
            "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_#0b0b0b]",
            "focus:-translate-x-px focus:-translate-y-px focus:shadow-[6px_6px_0px_0px_#0b0b0b] focus:ring-[3px] focus:ring-[#e6ff00]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3 bottom-3.5 h-4 w-4 text-[#0b0b0b]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
