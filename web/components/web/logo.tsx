import * as React from "react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: 32, label: "text-sm" },
  md: { box: 44, label: "text-base" },
  lg: { box: 60, label: "text-lg" },
} as const;

export function Logo({ size = "md", showWordmark = true, className }: LogoProps) {
  const s = sizeMap[size];

  return (
    <Link
      href="/"
      aria-label={`${BRAND_NAME} home`}
      className={cn(
        "group inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6ff00]",
        className,
      )}
    >
      <svg
        width={s.box}
        height={s.box}
        viewBox="0 0 60 60"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect x="3" y="3" width="54" height="54" rx="6" fill="#0b0b0b" />
        <rect x="9" y="9" width="42" height="10" fill="#e6ff00" />
        <rect x="9" y="24" width="42" height="10" fill="#1a46ff" />
        <rect x="39" y="9" width="12" height="34" fill="#ffffff" />
        <rect x="9" y="41" width="16" height="10" fill="#e6ff00" />
      </svg>
      {showWordmark ? (
        <span
          className={cn(
            "font-extrabold leading-none tracking-[-0.02em] text-[#0b0b0b]",
            s.label,
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {BRAND_NAME}
        </span>
      ) : null}
    </Link>
  );
}
