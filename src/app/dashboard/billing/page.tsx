// Server components
import { Suspense } from "react";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/server";
import { BillingHistoryTable } from "./BillingHistoryTable";
import { GenerateInvoiceForm } from "./GenerateInvoiceForm";
import { MetricCardSkeleton, TableSkeleton } from "~/components/ui/skeleton";

async function BillingMetrics() {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const metrics = await api.billing.getBillingMetrics({
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString(),
  });

  const formattedMRR = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(metrics.totalMRR);

  const formattedARR = new Intl.NumberFormat("en-US", {
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
          <p className="mt-2 text-3xl font-semibold">{formattedMRR}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Annual Recurring Revenue
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold">{formattedARR}</p>
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
  const firstOrg = organizations[0];

  if (!firstOrg) {
    return <div>No organizations found</div>;
  }

  const billingHistory = await api.billing.getBillingHistory({
    organizationId: firstOrg.id,
    limit: 5,
  });

  return <BillingHistoryTable billingHistory={billingHistory} />;
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
