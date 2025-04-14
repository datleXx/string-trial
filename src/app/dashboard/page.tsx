import { Suspense } from "react";
import { api } from "~/trpc/server";
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

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

async function DashboardMetrics() {
  const start_date = new Date();
  start_date.setMonth(start_date.getMonth() - 1);

  const metrics = await api.billing.getBillingMetrics({
    startDate: start_date.toISOString(),
    endDate: new Date().toISOString(),
  });

  const formatted_mrr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.totalMRR);

  const formatted_arr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.totalARR);

  const formatted_avg = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.averageSubscriptionValue);

  return (
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
        value={metrics.organizationCount}
        description="Number of active organizations"
      />
      <MetricCard
        title="Average Subscription Value"
        value={formatted_avg}
        description="Average value per subscription"
      />
    </div>
  );
}

async function RecentSubscriptions() {
  const subscriptions = await api.subscription.getAll();
  const recent_subs = subscriptions.slice(0, 5);

  if (recent_subs.length === 0) {
    return (
      <NoData
        title="No recent subscriptions"
        message="There are no items to display at this time."
      />
    );
  }

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
                <TableCell className="font-medium">
                  {sub.organization.name}
                </TableCell>
                <TableCell>{sub.feed.name}</TableCell>
                <TableCell>${sub.billingAmount}</TableCell>
                <TableCell>{sub.billingFrequency}</TableCell>
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

function RecentSubscriptionsLoading() {
  return <TableSkeleton />;
}

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          A high-level overview of your subscription metrics and recent
          activity.
        </p>
      </div>

      <div className="overflow-hidden">
        <Suspense fallback={<DashboardMetricsLoading />}>
          <DashboardMetrics />
        </Suspense>

        <div className="mt-8 overflow-x-auto">
          <Suspense fallback={<RecentSubscriptionsLoading />}>
            <RecentSubscriptions />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
