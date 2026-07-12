"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../core/utils/cn";

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode;
  align?: "left" | "right";
  children: React.ReactNode;
}

export function Dropdown({ trigger, align = "right", children, className, ...props }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)} {...props}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            "absolute z-50 mt-2 w-56 rounded-xl border border-border bg-card text-card-foreground p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-100",
            {
              "right-0 origin-top-right": align === "right",
              "left-0 origin-top-left": align === "left",
            }
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function DropdownItem({ className, children, active, ...props }: DropdownItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold select-none cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-border/50" />;
}
