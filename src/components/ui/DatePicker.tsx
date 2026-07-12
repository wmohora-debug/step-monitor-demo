"use client";

import * as React from "react";
import { cn } from "../../core/utils/cn";
import { Calendar } from "lucide-react";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        <div className="relative w-full">
          <input
            type="date"
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              {
                "border-destructive focus-visible:ring-destructive": !!error,
              },
              className
            )}
            {...props}
          />
          <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground/50 pointer-events-none" />
        </div>
        {error && <span className="text-[10px] font-bold text-destructive">{error}</span>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
