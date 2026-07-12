import * as React from "react";
import { cn } from "../../core/utils/cn";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, error, checked, onChange, disabled, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              id={id}
              ref={ref}
              checked={checked}
              onChange={onChange}
              disabled={disabled}
              className="sr-only peer"
              {...props}
            />
            {/* Custom Switch Track */}
            <div
              className={cn(
                "h-6 w-11 rounded-full border border-input bg-secondary transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed",
                {
                  "border-destructive": !!error,
                },
                className
              )}
            >
              {/* Slider Thumb */}
              <div className="h-4.5 w-4.5 rounded-full bg-card border border-border/20 shadow-sm transition-transform duration-200 translate-x-[3px] translate-y-[2.5px] peer-checked:translate-x-[21px] peer-checked:bg-primary-foreground" />
            </div>
          </div>
          {label && (
            <span className="text-sm font-medium text-foreground group-hover:text-foreground/95 transition-colors">
              {label}
            </span>
          )}
        </label>
        {error && <span className="text-xs text-destructive font-medium ml-14">{error}</span>}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
export type { Switch as UI_SwitchProps };
