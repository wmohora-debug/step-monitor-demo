"use client";

import React, { useState } from "react";
import { cn } from "../../core/utils/cn";

export interface TooltipProps {
  children: React.ReactElement;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ children, content, position = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-semibold text-card-foreground bg-card border border-border rounded shadow-md pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100",
            {
              // Position styles
              "bottom-full left-1/2 -translate-x-1/2 mb-2": position === "top",
              "top-full left-1/2 -translate-x-1/2 mt-2": position === "bottom",
              "right-full top-1/2 -translate-y-1/2 mr-2": position === "left",
              "left-full top-1/2 -translate-y-1/2 ml-2": position === "right",
            },
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
