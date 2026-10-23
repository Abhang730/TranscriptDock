import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

const alertVariants = cva(
  "rounded-[4px] border-2 border-[#0b0b0b] p-4 text-sm flex gap-3 shadow-[3px_3px_0px_0px_#0b0b0b]",
  {
    variants: {
      variant: {
        info: "bg-white text-[#0b0b0b] border-[#0b0b0b]",
        success: "bg-[#e6ff00] text-[#0b0b0b] border-[#0b0b0b]",
        warning: "bg-[#fff4d6] text-[#7a4d00] border-[#7a4d00]",
        danger: "bg-[#f7d9d9] text-[#d22b2b] border-[#d22b2b]",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    const icon =
      variant === "success"
        ? <CheckCircle className="h-5 w-5 shrink-0" strokeWidth={3} />
        : variant === "warning" || variant === "danger"
        ? <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={3} />
        : <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={3} />;

    return (
      <div
        ref={ref}
        className={cn(alertVariants({ variant }), className)}
        role="alert"
        {...props}
      >
        {icon}
        {children}
      </div>
    );
  },
);

Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <strong ref={ref} className={cn("block text-sm font-bold leading-tight", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm mt-1 text-[#3a3a3a]", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
