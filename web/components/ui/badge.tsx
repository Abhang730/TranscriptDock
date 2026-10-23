import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center border-2 border-[#0b0b0b] text-[0.65rem] font-extrabold uppercase tracking-[0.06em] px-2.5 py-1 rounded-[2px] leading-none",
  {
    variants: {
      variant: {
        accent:
          "bg-[#e6ff00] text-[#0b0b0b] border-[#0b0b0b]",
        blue:
          "bg-[#1a46ff] text-white border-[#0b0b0b]",
        black:
          "bg-[#0b0b0b] text-white border-[#0b0b0b]",
        muted:
          "bg-[#faf8f2] text-[#0b0b0b] border-[#c9c7bd]",
        neutral:
          "bg-[#efece2] text-[#0b0b0b] border-[#0b0b0b]",
        danger:
          "bg-[#f7d9d9] text-[#d22b2b] border-[#d22b2b]",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
