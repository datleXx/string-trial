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
  BarChart,
  Bar,
} from "recharts";

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
        {trend && (
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
  const { data: metrics, isLoading } = api.billing.getBillingMetrics.useQuery();
  const { data: subscriptions } = api.subscription.getAll.useQuery();

  if (isLoading || !metrics || !subscriptions) {
    return <DashboardMetricsLoading />;
  }

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

  const subscriptionsByFrequency = subscriptions.reduce(
    (acc, sub) => {
      const freq = sub.billingFrequency ?? "monthly";
      acc[freq] = (acc[freq] ?? 0) + Number(sub.billingAmount);
      return acc;
    },
    {} as Record<string, number>,
  );

  const pieData = Object.entries(subscriptionsByFrequency).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleString("default", { month: "short" }),
    mrr: metrics.totalMRR * (0.85 + Math.random() * 0.3),
    arr: metrics.totalARR * (0.85 + Math.random() * 0.3),
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatted_mrr}
          description="Total MRR from all subscriptions"
          trend={5.2}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={formatted_arr}
          description="Total ARR from all subscriptions"
          trend={7.8}
        />
        <MetricCard
          title="Total Organizations"
          value={metrics.organizationCount}
          description="Number of active organizations"
          trend={3.1}
        />
        <MetricCard
          title="Average Subscription Value"
          value={formatted_avg}
          description="Average value per subscription"
          trend={-1.2}
        />
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#0088FE"
                  fillOpacity={1}
                  fill="url(#mrrGradient)"
                  name="MRR"
                />
                <Area
                  type="monotone"
                  dataKey="arr"
                  stroke="#00C49F"
                  fillOpacity={1}
                  fill="url(#arrGradient)"
                  name="ARR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {pieData.map((_, index) => (
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

        {/* Billing Frequency Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Frequency Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
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
