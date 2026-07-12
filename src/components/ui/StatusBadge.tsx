import * as React from "react";
import { cn } from "../../core/utils/cn";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "active" | "inactive" | "pending" | "draft" | string;
  labels?: Record<string, string>;
}

export function StatusBadge({ className, status, labels, ...props }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  // Custom or fallback display label
  const displayLabel = labels?.[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider select-none",
        {
          // Active state (Success)
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400": 
            normalizedStatus === "active" || normalizedStatus === "success" || normalizedStatus === "approved",
          // Inactive state (Danger)
          "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400": 
            normalizedStatus === "inactive" || normalizedStatus === "danger" || normalizedStatus === "rejected",
          // Pending state (Warning)
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400": 
            normalizedStatus === "pending" || normalizedStatus === "warning",
          // Draft / Default state (Neutral)
          "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400": 
            normalizedStatus === "draft" || normalizedStatus === "neutral" || normalizedStatus === "inactive" || normalizedStatus === "disabled",
        },
        className
      )}
      {...props}
    >
      {/* Pulse Dot Indicator */}
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span
          className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", {
            "bg-emerald-500": normalizedStatus === "active" || normalizedStatus === "success" || normalizedStatus === "approved",
            "bg-rose-500": normalizedStatus === "inactive" || normalizedStatus === "danger" || normalizedStatus === "rejected",
            "bg-amber-500": normalizedStatus === "pending" || normalizedStatus === "warning",
            "bg-slate-500": normalizedStatus === "draft" || normalizedStatus === "neutral" || normalizedStatus === "inactive" || normalizedStatus === "disabled",
          })}
        />
        <span
          className={cn("relative inline-flex rounded-full h-1.5 w-1.5", {
            "bg-emerald-600 dark:bg-emerald-400": normalizedStatus === "active" || normalizedStatus === "success" || normalizedStatus === "approved",
            "bg-rose-600 dark:bg-rose-400": normalizedStatus === "inactive" || normalizedStatus === "danger" || normalizedStatus === "rejected",
            "bg-amber-600 dark:bg-amber-400": normalizedStatus === "pending" || normalizedStatus === "warning",
            "bg-slate-600 dark:bg-slate-400": normalizedStatus === "draft" || normalizedStatus === "neutral" || normalizedStatus === "inactive" || normalizedStatus === "disabled",
          })}
        />
      </span>
      {displayLabel}
    </div>
  );
}
export type { StatusBadgeProps as UI_StatusBadgeProps };
