"use client";

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
import { SubscriptionDialog } from "./CreateSubscriptionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";

function SubscriptionStatus({ accessUntil }: { accessUntil: Date }) {
  const now = new Date();
  const is_active = new Date(accessUntil) > now;

  return (
    <Badge variant={is_active ? "secondary" : "destructive"}>
      {is_active ? "Active" : "Expired"}
    </Badge>
  );
}

function SubscriptionsList() {
  const utils = api.useUtils();
  const { data: subscriptions, isLoading } = api.subscription.getAll.useQuery();
  const deleteMutation = api.subscription.delete.useMutation({
    onSuccess: () => {
      toast.success("Subscription deleted successfully");
      void utils.subscription.getAll.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete subscription");
    },
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <NoData
        title="No subscriptions"
        message="There are no items to display at this time."
      />
    );
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <Card>
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
                <TableHead className="table-cell">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    <div>
                      {sub.organization.name}
                      <div className="text-muted-foreground text-sm font-light md:hidden">
                        {sub.feed.name}
                      </div>
                      <div className="text-muted-foreground text-sm font-light sm:hidden">
                        <SubscriptionStatus
                          accessUntil={new Date(sub.accessUntil)}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-light md:table-cell">
                    {sub.feed.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <SubscriptionStatus
                      accessUntil={new Date(sub.accessUntil)}
                    />
                  </TableCell>
                  <TableCell className="font-light">
                    ${sub.billingAmount}/{sub.billingFrequency}
                  </TableCell>
                  <TableCell className="hidden font-light lg:table-cell">
                    {new Date(sub.accessUntil).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="table-cell">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <SubscriptionDialog mode="update" initial_data={sub}>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            Edit
                          </DropdownMenuItem>
                        </SubscriptionDialog>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => handleDelete(sub.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Subscriptions
          </h1>
          <p className="text-muted-foreground mt-2 font-light">
            Manage and monitor active subscriptions across organizations.
          </p>
        </div>
        <SubscriptionDialog mode="create">
          <Button className="w-full sm:w-auto">New Subscription</Button>
        </SubscriptionDialog>
      </div>

      <SubscriptionsList />
    </div>
  );
}
