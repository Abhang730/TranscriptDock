import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const labelVariants = cva(
  "text-[0.75rem] font-bold uppercase tracking-[0.04em] leading-none text-[#0b0b0b]",
  {
    variants: {
      variant: {
        default: "block mb-1.5",
        stacked: "block mb-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, ...props }, ref) => (
    <label className={cn(labelVariants({ variant }), className)} ref={ref} {...props} />
  ),
);
Label.displayName = "Label";

export { Label, labelVariants };
