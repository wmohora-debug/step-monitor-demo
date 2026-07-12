import * as React from "react";
import { cn } from "../../core/utils/cn";
import { Card, CardContent } from "./Card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string | number;
    type: "up" | "down" | "neutral";
  };
}

export function StatCard({
  className,
  title,
  value,
  icon,
  description,
  trend,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden group transition-all hover:shadow-md", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            <div className="text-2xl font-black tracking-tight">{value}</div>
          </div>
          {icon && (
            <div className="p-2.5 rounded-xl bg-secondary/80 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all">
              {icon}
            </div>
          )}
        </div>

        {(description || trend) && (
          <div className="flex items-center gap-2 mt-4 text-xs">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md",
                  {
                    "bg-emerald-500/10 text-emerald-500": trend.type === "up",
                    "bg-rose-500/10 text-rose-500": trend.type === "down",
                    "bg-muted text-muted-foreground": trend.type === "neutral",
                  }
                )}
              >
                {trend.type === "up" && <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.type === "down" && <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.value}
              </span>
            )}
            {description && <span className="text-muted-foreground font-medium">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export type { StatCardProps as UI_StatCardProps };
