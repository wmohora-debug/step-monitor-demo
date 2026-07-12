import * as React from "react";
import { cn } from "../../core/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground": variant === "default",
          "border-transparent bg-secondary text-secondary-foreground": variant === "secondary",
          "border-border text-foreground": variant === "outline",
          "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400": variant === "success",
          "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400": variant === "warning",
          "border-transparent bg-rose-500/10 text-rose-600 dark:text-rose-400": variant === "danger",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps as UI_BadgeProps };
