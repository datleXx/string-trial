"use client";

import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { BillingHistoryTable } from "./BillingHistoryTable";
import { MetricCardSkeleton } from "~/components/ui/skeleton";

function BillingMetrics() {
  const { data: metrics, isLoading } = api.metrics.getBillingMetrics.useQuery({
    months: 12,
  });

  if (!metrics) {
    return null;
  }

  if (isLoading) {
    return <BillingMetricsLoading />;
  }

  const formatted_mrr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.current.total_mrr);

  const formatted_arr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.current.total_arr);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Monthly Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formatted_mrr}</p>
          <p className="text-muted-foreground mt-2 text-sm font-light">
            Total revenue this month
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Annual Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formatted_arr}</p>
          <p className="text-muted-foreground mt-2 text-sm font-light">
            Projected yearly revenue
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Total Organizations
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">
            {metrics.current.organization_count}
          </p>
          <p className="text-muted-foreground mt-2 text-sm font-light">
            Active paying customers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingMetricsLoading() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
        <p className="text-muted-foreground mt-2 font-light">
          Manage billing, generate invoices, and view financial metrics.
        </p>
      </div>

      <BillingMetrics />

      <div>
        <BillingHistoryTable />
      </div>
    </div>
  );
}
