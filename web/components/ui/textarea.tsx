import * as React from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        className={cn(
          "w-full min-h-[120px] resize-y rounded-[4px] border-2 border-[#0b0b0b] bg-white px-3.5 py-2.5 text-sm text-[#0b0b0b] shadow-[3px_3px_0px_0px_#0b0b0b] placeholder:text-[#6b6b6b] outline-none transition-[box-shadow,transform] duration-75",
          "focus:-translate-x-px focus:-translate-y-px focus:shadow-[6px_6px_0px_0px_#0b0b0b] focus:ring-[3px] focus:ring-[#e6ff00]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
