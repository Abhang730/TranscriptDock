"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-bold tracking-wide transition-[transform,box-shadow,background-color] duration-75 border-2 border-[#0b0b0b] shadow-[3px_3px_0px_0px_#0b0b0b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6ff00] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0b0b0b] text-white hover:bg-black hover:shadow-[4px_4px_0px_0px_#0b0b0b] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-[3px_3px_0px_0px_#0b0b0b]",
        accent:
          "bg-[#e6ff00] text-[#0b0b0b] hover:bg-[#d6e600] hover:shadow-[4px_4px_0px_0px_#0b0b0b] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-[3px_3px_0px_0px_#0b0b0b]",
        blue:
          "bg-[#1a46ff] text-white hover:bg-[#0f38e6] hover:shadow-[4px_4px_0px_0px_#0b0b0b] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-[3px_3px_0px_0px_#0b0b0b]",
        ghost:
          "bg-transparent text-[#0b0b0b] border-2 border-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-white",
        link: "text-[#0b0b0b] underline underline-offset-4 hover:no-underline font-bold border-0 shadow-none",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /** Render the single child element instead of a <button>. */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, isLoading, children, disabled, asChild, ...props },
    ref,
  ) {
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-0"
              aria-hidden
            />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
