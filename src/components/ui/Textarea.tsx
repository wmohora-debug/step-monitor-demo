import * as React from "react";
import { cn } from "../../core/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, rows = 4, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y min-h-[80px]",
            {
              "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive": !!error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-destructive mt-0.5">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
