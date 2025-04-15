"use client";

import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { BillingHistoryTable } from "./BillingHistoryTable";
import { GenerateInvoiceForm } from "./GenerateInvoiceForm";
import { MetricCardSkeleton, TableSkeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import { useRoleGuard } from "~/hooks/useRoleGuard";

function BillingMetrics() {
  const { data: metrics, isLoading } = api.billing.getBillingMetrics.useQuery();

  if (!metrics) {
    return null;
  }

  if (isLoading) {
    return <BillingMetricsLoading />;
  }

  const formatted_mrr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.total_mrr);

  const formatted_arr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.total_arr);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Monthly Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formatted_mrr}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Total revenue this month
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Annual Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formatted_arr}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Projected yearly revenue
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Total Organizations
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">
            {metrics.organization_count}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Active paying customers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingHistorySection() {
  const { data: billing_history, isLoading } =
    api.billing.getAllBillingHistory.useQuery();

  if (isLoading || !billing_history) {
    return <BillingHistoryLoading />;
  }

  return <BillingHistoryTable billing_history={billing_history} />;
}

function GenerateInvoiceSection() {
  const { data: organizations, isLoading } = api.organization.getAll.useQuery();

  if (!organizations) {
    return null;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return <GenerateInvoiceForm organizations={organizations} />;
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

function BillingHistoryLoading() {
  return <TableSkeleton />;
}

export default function BillingPage() {
  const { user } = useRoleGuard({
    required_roles: ["admin", "viewer"],
  });

  const view_only = user?.role === "viewer";

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage billing, generate invoices, and view financial metrics.
        </p>
      </div>

      <Separator className="my-6" />

      <BillingMetrics />

      <Tabs defaultValue="history" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="history">Billing History</TabsTrigger>
          <TabsTrigger disabled={view_only} value="invoice">
            Invoice Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <BillingHistorySection />
        </TabsContent>

        <TabsContent value="invoice">
          <GenerateInvoiceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
