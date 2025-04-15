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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from "dayjs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
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
  const { data: metrics, isLoading } = api.billing.getBillingMetrics.useQuery({
    months: 12,
  });

  if (isLoading || !metrics) {
    return <DashboardMetricsLoading />;
  }

  const formatted_mrr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.current.total_mrr);

  const formatted_arr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.current.total_arr);

  const formatted_avg = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.current.average_invoice_value);

  // Prepare data for billing frequency chart
  const billing_frequency_data = [
    {
      name: "Monthly",
      value: metrics.current.monthly_subscriptions,
    },
    {
      name: "Yearly",
      value: metrics.current.yearly_subscriptions,
    },
  ];

  // Prepare data for collection metrics
  const collection_data = [
    {
      name: "Paid",
      value: metrics.current.total_paid,
    },
    {
      name: "Pending",
      value: metrics.current.total_pending,
    },
  ];

  // Prepare data for historical revenue chart
  const revenue_history = metrics.historical.map((month) => ({
    name: dayjs(month.month).format("MMM YY"),
    month: month.month,
    MRR: month.mrr,
    ARR: month.arr,
    "Active Subscriptions": month.active_subscriptions,
    "New Subscriptions": month.new_subscriptions,
  }));

  return (
    <div className="space-y-8">
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
          value={metrics.current.organization_count}
          description="Number of active organizations"
        />
        <MetricCard
          title="Average Subscription Value"
          value={formatted_avg}
          description="Average value per subscription"
        />
      </div>

      {/* New Historical Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Subscription Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenue_history}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="activeSubsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FF8042" stopOpacity={0} />
                    <stop offset="95%" stopColor="#FF8042" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="newSubsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FFBB28" stopOpacity={0} />
                    <stop offset="95%" stopColor="#FFBB28" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value: number) => String(Math.round(value))}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "MRR" || name === "ARR") {
                      return [`$${value.toFixed(2)}`, name];
                    }
                    return [Math.round(value), name];
                  }}
                  labelFormatter={(label: string) => label}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="MRR"
                  stroke="#0088FE"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#mrrGradient)"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="ARR"
                  stroke="#00C49F"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#arrGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="Active Subscriptions"
                  stroke="#FF8042"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#activeSubsGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="New Subscriptions"
                  stroke="#FFBB28"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#newSubsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Billing Frequency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Frequency Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billing_frequency_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {billing_frequency_data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Collection Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collection_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) =>
                      `${name} ($${Number(value).toFixed(2)})`
                    }
                  >
                    {collection_data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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

export default function DashboardPage() {
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
      </div>
    </div>
  );
}
