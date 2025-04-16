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
import { useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { PaginationControls } from "~/app/_components/PaginationControls";

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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: paginated_data, isLoading } =
    api.subscription.getPaginated.useQuery({
      page,
      page_size: PAGE_SIZE,
    });

  const deleteMutation = api.subscription.delete.useMutation({
    onSuccess: () => {
      toast.success("Subscription deleted successfully");
      void utils.subscription.getPaginated.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete subscription");
    },
  });

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
                <TableHead className="w-[200px]">Organization</TableHead>
                <TableHead className="hidden w-[180px] md:table-cell">
                  Feed
                </TableHead>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  Status
                </TableHead>
                <TableHead className="w-[120px]">Billing</TableHead>
                <TableHead className="hidden w-[120px] lg:table-cell">
                  Access Until
                </TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell className="w-[200px]">
                      <Skeleton className="h-4 w-[140px]" />
                      <div className="mt-2 md:hidden">
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                      <div className="mt-2 sm:hidden">
                        <Skeleton className="h-5 w-[80px]" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden w-[180px] md:table-cell">
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell className="hidden w-[100px] sm:table-cell">
                      <Skeleton className="h-5 w-[80px]" />
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="hidden w-[120px] lg:table-cell">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="w-[80px]">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !paginated_data || paginated_data?.items.length === 0 ? (
                <NoData
                  title="No subscriptions"
                  message="There are no items to display at this time."
                />
              ) : (
                paginated_data?.items.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="w-[200px]">
                      <div>
                        <div className="truncate font-medium">
                          {sub.organization.name}
                        </div>
                        <div className="text-muted-foreground truncate text-sm font-light md:hidden">
                          {sub.feed.name}
                        </div>
                        <div className="text-muted-foreground text-sm font-light sm:hidden">
                          <SubscriptionStatus
                            accessUntil={new Date(sub.accessUntil)}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden w-[180px] font-light md:table-cell">
                      <div className="truncate">{sub.feed.name}</div>
                    </TableCell>
                    <TableCell className="hidden w-[100px] sm:table-cell">
                      <SubscriptionStatus
                        accessUntil={new Date(sub.accessUntil)}
                      />
                    </TableCell>
                    <TableCell className="w-[120px] font-light">
                      <div className="truncate">
                        ${sub.billingAmount}/{sub.billingFrequency}
                      </div>
                    </TableCell>
                    <TableCell className="hidden w-[120px] font-light lg:table-cell">
                      <div className="truncate">
                        {new Date(sub.accessUntil).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="w-[80px]">
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          page={page}
          setPage={setPage}
          total_pages={paginated_data?.metadata.page_count ?? 1}
          loading={isLoading}
        />
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="flex flex-col gap-5">
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
