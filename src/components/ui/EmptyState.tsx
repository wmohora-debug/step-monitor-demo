import * as React from "react";
import { cn } from "../../core/utils/cn";
import { Inbox, Search, WifiOff, ShieldAlert, AlertTriangle } from "lucide-react";
import { Card, CardTitle, CardDescription } from "./Card";

export type EmptyStateVariant = "no-data" | "no-search" | "no-internet" | "unauthorized" | "server-error";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  className,
  variant = "no-data",
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  // Setup default config based on variant selection
  let defaultIcon: React.ReactNode = <Inbox className="h-8 w-8" />;
  let defaultTitle = "No data available";
  let defaultDescription = "There are no records to display at this time.";
  let iconBgColor = "bg-secondary text-muted-foreground/80";

  switch (variant) {
    case "no-search":
      defaultIcon = <Search className="h-8 w-8" />;
      defaultTitle = "No search results";
      defaultDescription = "We couldn't find any matching records. Try checking your spelling or filters.";
      iconBgColor = "bg-blue-500/10 text-blue-500 dark:text-blue-400";
      break;
    case "no-internet":
      defaultIcon = <WifiOff className="h-8 w-8" />;
      defaultTitle = "Connection offline";
      defaultDescription = "Please check your network cables or Wi-Fi status and try again.";
      iconBgColor = "bg-amber-500/10 text-amber-500 dark:text-amber-400";
      break;
    case "unauthorized":
      defaultIcon = <ShieldAlert className="h-8 w-8" />;
      defaultTitle = "Access denied";
      defaultDescription = "You do not have the required administrative clearance to view these records.";
      iconBgColor = "bg-rose-500/10 text-rose-500 dark:text-rose-400";
      break;
    case "server-error":
      defaultIcon = <AlertTriangle className="h-8 w-8" />;
      defaultTitle = "Data sync failed";
      defaultDescription = "A database synchronizing pipeline error occurred. Please reload the console.";
      iconBgColor = "bg-rose-500/10 text-rose-500 dark:text-rose-400";
      break;
    case "no-data":
    default:
      defaultIcon = <Inbox className="h-8 w-8" />;
      defaultTitle = "No records found";
      defaultDescription = "No data is currently registered under this registry category.";
      iconBgColor = "bg-slate-500/10 text-slate-500 dark:text-slate-400";
      break;
  }

  const activeIcon = icon || defaultIcon;
  const activeTitle = title || defaultTitle;
  const activeDescription = description || defaultDescription;

  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border-dashed border-2 min-h-[350px] bg-card/40 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className={cn("p-4.5 rounded-2xl mb-4 shrink-0 shadow-sm animate-pulse", iconBgColor)}>
        {activeIcon}
      </div>
      <CardTitle className="text-base font-bold tracking-tight">{activeTitle}</CardTitle>
      <CardDescription className="max-w-xs mt-2 text-xs text-muted-foreground leading-relaxed">
        {activeDescription}
      </CardDescription>
      {action && <div className="mt-6 animate-in fade-in duration-200">{action}</div>}
    </Card>
  );
}
export type { EmptyStateProps as UI_EmptyStateProps };
