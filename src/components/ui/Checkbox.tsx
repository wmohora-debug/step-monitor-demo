import * as React from "react";
import { cn } from "../../core/utils/cn";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, checked, onChange, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              id={id}
              ref={ref}
              checked={checked}
              onChange={onChange}
              className="sr-only peer"
              {...props}
            />
            {/* Custom Checkbox Box */}
            <div
              className={cn(
                "h-5 w-5 rounded border border-input bg-background flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/80 disabled:opacity-50 disabled:cursor-not-allowed",
                {
                  "border-destructive": !!error,
                },
                className
              )}
            >
              <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          {label && (
            <span className="text-sm font-medium text-foreground group-hover:text-foreground/95 transition-colors">
              {label}
            </span>
          )}
        </label>
        {error && <span className="text-xs text-destructive font-medium ml-7">{error}</span>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
export type { Checkbox as UI_CheckboxProps };
