import * as React from "react";
import { cn } from "../../core/utils/cn";
import { Skeleton } from "./Skeleton";

// 1. Spinner Component
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary shrink-0",
        {
          "h-4 w-4 border-2": size === "sm",
          "h-8 w-8 border-3": size === "md",
          "h-12 w-12 border-4": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}

// 2. Progress Bar Component
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
}

export function ProgressBar({ className, value, ...props }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-1.5 w-full bg-secondary rounded-full overflow-hidden", className)} {...props}>
      <div
        className="h-full bg-primary rounded-full transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

// 3. Full Page Loader Component
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner size="lg" />
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight">Syncing Security Matrix</p>
          <p className="text-xs text-muted-foreground animate-pulse">Loading secure admin resources...</p>
        </div>
      </div>
    </div>
  );
}

// 4. Card Skeleton Component
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// 5. Table Skeleton Component
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header skeleton */}
      <div className="border-b border-border bg-muted/30 px-6 py-4 flex gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={`head-${idx}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Body skeletons */}
      <div className="divide-y divide-border px-6">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`row-${rIdx}`} className="py-4.5 flex gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton key={`cell-${rIdx}-${cIdx}`} className="h-4.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Form Skeleton Component
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
