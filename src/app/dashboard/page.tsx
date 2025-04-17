"use client";

import { Suspense } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { NoData } from "~/components/ui/no-data";
import { MetricCardSkeleton, TableSkeleton } from "~/components/ui/skeleton";
import { AdvancedMetrics } from "./components/AdvancedMetrics";

function MetricCard({
  title,
  value,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  trend?: number;
}) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="text-muted-foreground mt-2 text-sm font-light">
          {description}
        </p>
        {typeof trend !== "undefined" && trend !== 0 && (
          <p
            className={`mt-2 text-sm ${trend > 0 ? "text-green-500" : "text-red-500"}`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardMetrics() {
  const { data: metrics, isLoading } = api.metrics.getBillingMetrics.useQuery({
    months: 12,
  });

  const formatted_mrr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics?.current.total_mrr ?? 0);

  const formatted_arr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics?.current.total_arr ?? 0);

  const formatted_avg = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics?.current.average_invoice_value ?? 0);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <DashboardMetricsLoading />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Monthly Recurring Revenue"
            value={formatted_mrr}
            description="Total MRR from all subscriptions"
          />
          <MetricCard
            title="Annual Recurring Revenue"
            value={formatted_arr}
            description="Total ARR from all subscriptions"
          />
          <MetricCard
            title="Total Organizations"
            value={metrics?.current.organization_count ?? 0}
            description="Number of active organizations"
          />
          <MetricCard
            title="Average Subscription Value"
            value={formatted_avg}
            description="Average value per subscription"
          />
        </div>
      )}

      <AdvancedMetrics />

      <RecentSubscriptions />
    </div>
  );
}

function RecentSubscriptions() {
  const { data: subscriptions, isLoading } = api.subscription.getAll.useQuery();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <NoData
        title="No recent subscriptions"
        message="There are no items to display at this time."
      />
    );
  }

  const recent_subs = subscriptions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Feed</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent_subs.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.organization.name}</TableCell>
                <TableCell className="font-light">{sub.feed.name}</TableCell>
                <TableCell className="font-light">
                  ${sub.billingAmount}
                </TableCell>
                <TableCell className="font-light">
                  {sub.billingFrequency}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DashboardMetricsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 font-light">
          A high-level overview of your subscription metrics and recent
          activity.
        </p>
      </div>

      <div className="overflow-hidden">
        <Suspense fallback={<DashboardMetricsLoading />}>
          <DashboardMetrics />
        </Suspense>
      </div>
    </div>
  );
}
