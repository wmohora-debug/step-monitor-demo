"use client";

import React from "react";
import { Filter, X, SlidersHorizontal, Calendar } from "lucide-react";
import { Button, Dropdown, Checkbox, Drawer, DropdownItem, DropdownDivider } from "../ui";
import { cn } from "../../core/utils/cn";

// 1. Filter Chips (Displays active filters)
export interface FilterChip {
  key: string;
  label: string;
  displayValue: string;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function FilterChips({ chips, onRemove, onClear }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">
        Active Filters:
      </span>
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground border border-border/40 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs font-semibold"
        >
          <span>{chip.label}:</span>
          <strong className="text-foreground">{chip.displayValue}</strong>
          <button
            onClick={() => onRemove(chip.key)}
            className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        onClick={onClear}
        className="text-xs text-primary font-bold hover:underline ml-1 cursor-pointer"
      >
        Clear All
      </button>
    </div>
  );
}

// 2. Generic Filter Dropdown
export interface FilterDropdownOption {
  value: string | number;
  label: string;
}

export interface FilterDropdownProps {
  label: string;
  selected: string | number | null | undefined;
  onChange: (value: string | number | null) => void;
  options: FilterDropdownOption[];
  icon?: React.ComponentType<any>;
}

export function FilterDropdown({
  label,
  selected,
  onChange,
  options,
  icon: Icon = SlidersHorizontal,
}: FilterDropdownProps) {
  const activeLabel = options.find((opt) => opt.value === selected)?.label || label;

  return (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 rounded-lg text-xs font-semibold",
            selected !== undefined && selected !== null && selected !== "" && "border-primary bg-primary/5"
          )}
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {activeLabel}
        </Button>
      }
    >
      <div className="px-3 py-2 border-b border-border/40">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Filter by {label}
        </span>
      </div>
      <div className="p-1 space-y-0.5">
        <DropdownItem
          onClick={() => onChange(null)}
          className={cn("text-xs font-semibold", !selected && "bg-secondary text-primary")}
        >
          All {label}s
        </DropdownItem>
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn("text-xs font-semibold", selected === option.value && "bg-secondary text-primary")}
          >
            {option.label}
          </DropdownItem>
        ))}
      </div>
    </Dropdown>
  );
}

// 3. Date Range Filter Inputs
export interface DateRangeFilterProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <span className="text-xs text-muted-foreground font-semibold">to</span>
      <div className="relative">
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

// 4. Mobile Filter Drawer
export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function FilterDrawer({ isOpen, onClose, onClear, children }: FilterDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filter Options">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-sm font-bold">Filters</h3>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground font-bold underline cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-5">
          {children}
        </div>

        <div className="pt-4">
          <Button onClick={onClose} className="w-full">
            Apply Filters
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
