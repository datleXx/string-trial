import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from "dayjs";

const COLORS = {
  primary: "#0088FE",
  success: "#00C49F",
  warning: "#FFBB28",
  error: "#FF8042",
  purple: "#8884d8",
  teal: "#26A69A",
};

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function AdvancedMetrics() {
  const { data: user_metrics } = api.metrics.getUserMetrics.useQuery({
    months: 12,
    include_inactive: true,
  });

  const { data: billing_metrics } = api.metrics.getBillingMetrics.useQuery({
    months: 12,
  });

  if (!user_metrics || !billing_metrics) return null;

  // Prepare cohort data
  const cohort_data = user_metrics.historical.map((month) => ({
    month: dayjs(month.month).format("MMM YY"),
    "New Users": month.new_users,
    "Admin Users": month.users_by_role.admin,
    "Viewer Users": month.users_by_role.viewer,
    "Normal Users": month.users_by_role.user,
  }));

  // Prepare data for billing frequency chart
  const billing_frequency_data = [
    {
      name: "Monthly",
      value: billing_metrics.current.monthly_subscriptions,
    },
    {
      name: "Yearly",
      value: billing_metrics.current.yearly_subscriptions,
    },
  ];

  // Prepare data for collection metrics
  const collection_data = [
    {
      name: "Paid",
      value: billing_metrics.current.total_paid,
    },
    {
      name: "Pending",
      value: billing_metrics.current.total_pending,
    },
  ];

  // Prepare data for historical revenue chart
  const revenue_history = billing_metrics.historical.map((month) => ({
    name: dayjs(month.month).format("MMM YY"),
    month: month.month,
    MRR: month.mrr,
    ARR: month.arr,
    "Active Subscriptions": month.active_subscriptions,
    "New Subscriptions": month.new_subscriptions,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* User Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>User Cohort Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cohort_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} separator=": " />
                <Legend
                  iconSize={10}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="New Users"
                  fill={COLORS.primary}
                  stackId="users"
                />
                <Bar
                  yAxisId="left"
                  dataKey="Admin Users"
                  fill={COLORS.success}
                  stackId="users"
                />
                <Bar
                  yAxisId="left"
                  dataKey="Viewer Users"
                  fill={COLORS.warning}
                  stackId="users"
                />
                <Bar
                  yAxisId="left"
                  dataKey="Normal Users"
                  fill={COLORS.error}
                  stackId="users"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Retention Rate"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue & Subscription Growth */}
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
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.7} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value: number) => String(Math.round(value))}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number, name: string) => {
                    if (name === "MRR" || name === "ARR") {
                      return [`$${value.toFixed(2)}`, name];
                    }
                    return [Math.round(value), name];
                  }}
                  separator=": "
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
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
                  >
                    {billing_frequency_data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === "Monthly" || name === "Yearly") {
                        return [`${value}`, name];
                      }
                      return [Math.round(value), name];
                    }}
                    separator=": "
                  />
                  <Legend
                    iconSize={10}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                    align="center"
                    verticalAlign="bottom"
                  />
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
                  >
                    {collection_data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === "Paid" || name === "Pending") {
                        return [`$${value}`, name];
                      }
                      return [Math.round(value), name];
                    }}
                    separator=": "
                  />
                  <Legend
                    iconSize={10}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                    align="center"
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
