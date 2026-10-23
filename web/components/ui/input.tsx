import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-[4px] border-2 border-[#0b0b0b] bg-white px-3.5 py-2.5 text-sm text-[#0b0b0b] shadow-[3px_3px_0px_0px_#0b0b0b] placeholder:text-[#6b6b6b] outline-none transition-[box-shadow,transform] duration-75",
          "hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_#0b0b0b]",
          "focus:-translate-x-px focus:-translate-y-px focus:shadow-[6px_6px_0px_0px_#0b0b0b] focus:ring-[3px] focus:ring-[#e6ff00]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
