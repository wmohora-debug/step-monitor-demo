"use client";

import React from "react";
import { ArrowLeft, Plus, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import { Button, Card, SearchInput, Badge, StatusBadge } from "../ui";
import { cn } from "../../core/utils/cn";

// ----------------------------------------------------
// 1. CRUD LISTING PAGE TEMPLATE
// ----------------------------------------------------
export interface CrudPageTemplateProps {
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
  
  // Search
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters?: React.ReactNode;
  filterChips?: React.ReactNode;
  
  // Stats summary cards row
  stats?: React.ReactNode;
  
  // Main Table / Content
  children: React.ReactNode;
}

export function CrudPageTemplate({
  title,
  description,
  primaryAction,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters,
  filterChips,
  stats,
  children,
}: CrudPageTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground leading-normal max-w-2xl font-semibold">
              {description}
            </p>
          )}
        </div>
        {primaryAction && (
          <Button onClick={primaryAction.onClick} className="gap-1.5 shrink-0 self-start md:self-center">
            {primaryAction.icon ? (
              <primaryAction.icon className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {primaryAction.label}
          </Button>
        )}
      </div>

      {/* Stats Summary row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {stats}
        </div>
      )}

      {/* Search & Filters Toolbar */}
      {(onSearchChange !== undefined || filters || filterChips) && (
        <div className="bg-card border border-border rounded-xl p-4.5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left side: Search input */}
            {onSearchChange !== undefined && (
              <div className="w-full md:w-80">
                <SearchInput
                  placeholder={searchPlaceholder}
                  value={searchQuery || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onClear={() => onSearchChange("")}
                />
              </div>
            )}

            {/* Right side: Inline custom filters */}
            {filters && (
              <div className="flex flex-wrap items-center gap-2">
                {filters}
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {filterChips}
        </div>
      )}

      {/* Main Table Grid container */}
      <div className="animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. DETAIL/VIEW PAGE TEMPLATE
// ----------------------------------------------------
export interface DetailPageTemplateProps {
  title: string;
  subtitle?: string;
  status?: string;
  backHref: string;
  actions?: React.ReactNode;
  
  // Metadata fields
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    author?: string;
  };
  
  // Layout panels
  summaryCard?: React.ReactNode;
  timeline?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailPageTemplate({
  title,
  subtitle,
  status,
  backHref,
  actions,
  metadata,
  summaryCard,
  timeline,
  children,
}: DetailPageTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Back button & actions header row */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Link>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Page Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            {status && <StatusBadge status={status} />}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-semibold leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Responsive details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Main details, subsections */}
        <div className="lg:col-span-2 space-y-6">
          {children}
        </div>

        {/* Right 1 Column: Summary card, metadata, and activity history */}
        <div className="space-y-6">
          {/* Summary / Side card */}
          {summaryCard}

          {/* Metadata Card */}
          {(metadata?.createdAt || metadata?.updatedAt || metadata?.author) && (
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Document Audit Info
              </h3>
              <div className="space-y-3.5 text-xs font-semibold text-muted-foreground/90">
                {metadata.createdAt && (
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>Created: <strong className="text-foreground">{metadata.createdAt}</strong></span>
                  </div>
                )}
                {metadata.updatedAt && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>Updated: <strong className="text-foreground">{metadata.updatedAt}</strong></span>
                  </div>
                )}
                {metadata.author && (
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                    <span>Author: <strong className="text-foreground">{metadata.author}</strong></span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Timeline Activity placeholder */}
          {timeline && (
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                System Activity Log
              </h3>
              <div className="relative border-l border-border pl-4 space-y-5 py-1">
                {timeline}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
