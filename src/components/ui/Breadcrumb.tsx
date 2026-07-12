import * as React from "react";
import { cn } from "../../core/utils/cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbProps extends React.HtmlHTMLAttributes<HTMLElement> {}

export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex flex-wrap items-center text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export interface BreadcrumbListProps extends React.HtmlHTMLAttributes<HTMLOListElement> {}

export function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-1.5 break-words", className)}
      {...props}
    />
  );
}

export interface BreadcrumbItemProps extends React.HtmlHTMLAttributes<HTMLLIElement> {}

export function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

export interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function BreadcrumbLink({ className, href, children, ...props }: BreadcrumbLinkProps) {
  return (
    <Link
      href={href}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export interface BreadcrumbPageProps extends React.HtmlHTMLAttributes<HTMLSpanElement> {}

export function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-semibold text-foreground truncate max-w-[120px] sm:max-w-none", className)}
      {...props}
    />
  );
}

export interface BreadcrumbSeparatorProps extends React.HtmlHTMLAttributes<HTMLLIElement> {}

export function BreadcrumbSeparator({ className, children, ...props }: BreadcrumbSeparatorProps) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("opacity-60 [&>svg]:size-3.5", className)}
      {...props}
    >
      {children ? children : <ChevronRight />}
    </li>
  );
}
