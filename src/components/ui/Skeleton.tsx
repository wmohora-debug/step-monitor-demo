import { cn } from "../../core/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted-foreground/15", className)}
      {...props}
    />
  );
}

export { Skeleton };
export type { Skeleton as UI_SkeletonProps };
