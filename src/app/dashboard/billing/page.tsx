// Server components
import { Suspense } from "react";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/server";
import { BillingHistoryTable } from "./BillingHistoryTable";
import { GenerateInvoiceForm } from "./GenerateInvoiceForm";
import { MetricCardSkeleton, TableSkeleton } from "~/components/ui/skeleton";

async function BillingMetrics() {
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

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Monthly Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formatted_mrr}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Annual Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formatted_arr}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Total Organizations
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">
            {metrics.organizationCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function BillingHistorySection() {
  const organizations = await api.organization.getAll();
  const first_org = organizations[0];

  if (!first_org) {
    return <div>No organizations found</div>;
  }

  const billing_history = await api.billing.getBillingHistory({
    organization_id: first_org.id,
    limit: 5,
  });

  return <BillingHistoryTable billing_history={billing_history} />;
}

async function GenerateInvoiceSection() {
  const organizations = await api.organization.getAll();
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

export default async function BillingPage() {
  return (
    <div className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage billing, generate invoices, and view financial metrics.
        </p>
      </div>

      <Suspense fallback={<BillingMetricsLoading />}>
        <BillingMetrics />
      </Suspense>

      <Suspense fallback={<BillingHistoryLoading />}>
        <BillingHistorySection />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <GenerateInvoiceSection />
      </Suspense>
    </div>
  );
}
