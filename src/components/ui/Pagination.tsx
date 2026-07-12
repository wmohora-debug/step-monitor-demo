import * as React from "react";
import { cn } from "../../core/utils/cn";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  className,
  currentPage,
  totalPages,
  onPageChange,
  ...props
}: PaginationProps) {
  // If only 1 page, don't show pagination controls
  if (totalPages <= 1) return null;

  const renderPages = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic with ellipsis
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("ellipsis-start");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("ellipsis-end");
        pages.push(totalPages);
      }
    }

    return pages.map((page, idx) => {
      if (typeof page === "string") {
        return (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        );
      }

      const isCurrent = page === currentPage;

      return (
        <Button
          key={page}
          variant={isCurrent ? "primary" : "outline"}
          size="sm"
          className="h-9 w-9 p-0 rounded-lg text-xs"
          onClick={() => onPageChange(page)}
          aria-current={isCurrent ? "page" : undefined}
        >
          {page}
        </Button>
      );
    });
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center items-center gap-1.5", className)}
      {...props}
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Pages List */}
      <div className="flex items-center gap-1">
        {renderPages()}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
