"use client";

import * as React from "react";
import { cn } from "../../core/utils/cn";
import { Check, X, ChevronDown } from "lucide-react";
import { Badge } from "./Badge";
import { Dropdown } from "./Dropdown";

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  selectedValues = [],
  onChange,
  placeholder = "Select options...",
  error,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleToggleOption = (value: string | number) => {
    const isSelected = selectedValues.includes(value);
    if (isSelected) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleRemoveValue = (e: React.MouseEvent, value: string | number) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const selectedLabels = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
      <div className="relative">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background cursor-pointer focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            {
              "border-destructive focus-within:ring-destructive": !!error,
            }
          )}
        >
          {selectedLabels.length === 0 ? (
            <span className="text-muted-foreground text-xs select-none">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 px-1.5 py-0.5 text-[11px]"
                >
                  {opt.label}
                  <span
                    onClick={(e) => handleRemoveValue(e, opt.value)}
                    className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </span>
                </Badge>
              ))}
            </div>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </div>

        {/* Dropdown Menu portal/element */}
        {isOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                No options available
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors",
                      isSelected && "bg-primary/5 text-primary"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {error && <span className="text-[10px] font-bold text-destructive">{error}</span>}
    </div>
  );
}
