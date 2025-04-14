import { Suspense } from "react";
import Link from "next/link";
import { api } from "~/trpc/server";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { NoData } from "~/components/ui/no-data";
import { TableSkeleton } from "~/components/ui/skeleton";

function SubscriptionStatus({ accessUntil }: { accessUntil: Date }) {
  const now = new Date();
  const is_active = new Date(accessUntil) > now;

  return (
    <Badge variant={is_active ? "secondary" : "destructive"}>
      {is_active ? "Active" : "Expired"}
    </Badge>
  );
}

async function SubscriptionsList() {
  const subscriptions = await api.subscription.getAll();

  if (subscriptions.length === 0) {
    return (
      <NoData
        title="No subscriptions"
        message="There are no items to display at this time."
      />
    );
  }

  return (
    <Card className="mt-8">
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead className="hidden md:table-cell">Feed</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Access Until
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    <div>
                      {sub.organization.name}
                      <div className="text-muted-foreground text-sm md:hidden">
                        {sub.feed.name}
                      </div>
                      <div className="text-muted-foreground text-sm sm:hidden">
                        <SubscriptionStatus
                          accessUntil={new Date(sub.accessUntil)}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {sub.feed.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <SubscriptionStatus
                      accessUntil={new Date(sub.accessUntil)}
                    />
                  </TableCell>
                  <TableCell>
                    ${sub.billingAmount}/{sub.billingFrequency}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {new Date(sub.accessUntil).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/subscriptions/${sub.id}`}>
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sm:hidden">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Subscriptions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor active subscriptions across organizations.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/subscriptions/new">New Subscription</Link>
        </Button>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <SubscriptionsList />
      </Suspense>
    </div>
  );
}
