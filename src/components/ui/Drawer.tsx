"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../../core/utils/cn";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = "right",
  size = "md",
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sliding Drawer Container */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 flex flex-col h-full bg-card text-card-foreground border-border shadow-xl z-10 overflow-hidden transform transition-transform duration-300 ease-in-out",
          {
            // Position locks
            "right-0 border-l animate-in slide-in-from-right": position === "right",
            "left-0 border-r animate-in slide-in-from-left": position === "left",
            // Width sizing
            "w-full max-w-sm": size === "sm",
            "w-full max-w-md": size === "md",
            "w-full max-w-lg": size === "lg",
          },
          className
        )}
      >
        {/* Header section */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border/40">
          <div className="space-y-1">
            {title && <h3 className="text-base font-bold leading-tight tracking-tight">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm">
          {children}
        </div>

        {/* Footer Section */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40 bg-muted/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
