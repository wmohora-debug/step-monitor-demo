import * as React from "react";
import { cn } from "../../core/utils/cn";

export interface RadioItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  value: string;
}

const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, label, value, name, checked, onChange, ...props }, ref) => {
    const id = React.useId();

    return (
      <label className="flex items-center gap-2 cursor-pointer select-none group">
        <div className="relative">
          <input
            type="radio"
            id={id}
            ref={ref}
            value={value}
            name={name}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          {/* Custom Radio Button */}
          <div
            className={cn(
              "h-5 w-5 rounded-full border border-input bg-background flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:border-primary group-hover:border-primary/80 disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
          >
            {/* Center dot */}
            <div className="h-2.5 w-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform duration-200" />
          </div>
        </div>
        <span className="text-sm font-medium text-foreground group-hover:text-foreground/95 transition-colors">
          {label}
        </span>
      </label>
    );
  }
);
RadioItem.displayName = "RadioItem";

export interface RadioGroupProps {
  label?: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { label: string; value: string; disabled?: boolean }[];
  error?: string;
  className?: string;
}

export function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  error,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <RadioItem
            key={opt.value}
            label={opt.label}
            value={opt.value}
            name={name}
            checked={value === opt.value}
            disabled={opt.disabled}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ))}
      </div>
      {error && <span className="text-xs text-destructive font-medium mt-0.5">{error}</span>}
    </div>
  );
}

export { RadioItem };
