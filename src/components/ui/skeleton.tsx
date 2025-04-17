import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { TableCell } from "./table";
import { TableRow } from "./table";
import { TableBody } from "./table";
import type { ColumnDef } from "@tanstack/react-table";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted/50", {
  variants: {
    variant: {
      default: "h-4 w-full",
      heading: "h-7 w-3/4",
      title: "h-5 w-1/2",
      avatar: "h-12 w-12 rounded-full",
      thumbnail: "h-24 w-24",
      button: "h-9 w-24",
      card: "h-[140px] w-full",
      input: "h-9 w-full",
      date: "h-9 w-[200px]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div className={cn(skeletonVariants({ variant }), className)} {...props} />
  );
}

// Composite components for common use cases
export function CardSkeleton() {
  return (
    <div className="space-y-5 rounded-xl border bg-white p-6">
      <Skeleton variant="heading" />
      <div className="space-y-3">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3">
      <Skeleton className="h-12 w-12" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export function TableRowSkeletonTanStack({
  columns,
}: {
  columns: ColumnDef<any>[];
}) {
  return (
    <TableBody>
      {Array.from({ length: 10 }).map((_, index) => (
        <TableRow
          key={`skeleton-${index}`}
          className="border-b transition-colors hover:bg-gray-50/50"
        >
          {columns.map((column, cellIndex) => (
            <TableCell
              key={`skeleton-cell-${cellIndex}`}
              style={{ maxWidth: column.size }}
              className="h-[49px] px-3 py-2 text-sm text-gray-700"
            >
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-5">
      <Skeleton variant="title" className="mb-4" />
      <Skeleton className="h-8 w-[120px]" />
      <Skeleton className="mt-4 h-4 w-[180px]" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full space-y-4 rounded-xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="heading" className="w-[200px]" />
        <Skeleton variant="button" />
      </div>
      <div className="space-y-3">
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-xl border bg-white p-6">
      <Skeleton variant="heading" className="w-[250px]" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton variant="input" className="max-w-[300px]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton variant="date" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton variant="date" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton variant="button" className="w-32" />
        </div>
      </div>
    </div>
  );
}

export function AdvancedMetricsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* User Cohort Analysis Skeleton */}
      <div className="rounded-xl border bg-white">
        <div className="p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>

      {/* Revenue & Subscription Growth Skeleton */}
      <div className="rounded-xl border bg-white">
        <div className="p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>

      {/* Two Column Charts Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Billing Frequency Distribution Skeleton */}
        <div className="rounded-xl border bg-white">
          <div className="p-6">
            <Skeleton variant="title" className="mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>

        {/* Collection Metrics Skeleton */}
        <div className="rounded-xl border bg-white">
          <div className="p-6">
            <Skeleton variant="title" className="mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>

      {/* Payment Patterns Analysis Skeleton */}
      <div className="rounded-xl border bg-white">
        <div className="p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>

      {/* Revenue Forecasting Skeleton */}
      <div className="rounded-xl border bg-white">
        <div className="p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  );
}
