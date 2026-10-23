import * as React from "react";
import { cn } from "@/lib/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-2 border-[#c9c7bd] bg-[#efece2] animate-pulse rounded-[4px]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
