"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table/data-table";
import { SubscriptionDialog } from "./CreateSubscriptionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import toast from "react-hot-toast";
import { useState } from "react";

// Define the type for your subscription data
type Subscription =
  RouterOutputs["subscription"]["getPaginated"]["items"][number];

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [organization_search, setOrganizationSearch] = useState("");
  const [feed_search, setFeedSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  console.log("columnFilters", columnFilters);

  const PAGE_SIZE = 10;

  const { data: organizations, isLoading: is_organizations_loading } =
    api.organization.getOrganizationWithFilters.useQuery({
      global_search: organization_search,
    });

  const { data: feeds, isLoading: is_feeds_loading } =
    api.feed.getWithFilters.useQuery({
      global_search: feed_search,
    });

  const { data: paginated_data, isLoading } =
    api.subscription.getPaginated.useQuery({
      page,
      page_size: PAGE_SIZE,
      sorting_state: {
        id: sorting[0]?.id ?? "",
        direction: sorting[0]?.desc ? "desc" : "asc",
      },
      filter_state: columnFilters as { id: string; value: string }[],
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

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "organization.name",
      header: "Organization",
      cell: ({ row }) => (
        <div className="truncate font-medium">
          {row.original.organization.name}
        </div>
      ),
      enableSorting: false,
      size: 192,
    },
    {
      accessorKey: "feed.name",
      header: "Feed",
      cell: ({ row }) => (
        <div className="hidden truncate md:block">{row.original.feed.name}</div>
      ),
      enableSorting: false,
      size: 192,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="hidden sm:block">
          <SubscriptionStatus
            accessUntil={new Date(row.original.accessUntil)}
          />
        </div>
      ),
      size: 96,
    },
    {
      accessorKey: "billing",
      header: "Billing",
      cell: ({ row }) => (
        <div className="truncate">
          ${row.original.billingAmount}/{row.original.billingFrequency}
        </div>
      ),
      size: 128,
    },
    {
      accessorKey: "accessUntil",
      header: "Access Until",
      cell: ({ row }) => (
        <div className="hidden truncate lg:block">
          {new Date(row.original.accessUntil).toLocaleDateString()}
        </div>
      ),
      size: 128,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="w-16">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SubscriptionDialog mode="update" initial_data={row.original}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Edit
                </DropdownMenuItem>
              </SubscriptionDialog>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => handleDelete(row.original.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      size: 64,
    },
  ];

  const filter_meta = [
    {
      id: "organization_name",
      label: "Organization",
      type: "dropdown" as const,
      options: organizations?.map((org) => ({
        label: org.name,
        value: org.id,
      })),
      className: "w-fit",
      onSearchChange: setOrganizationSearch,
      loading: is_organizations_loading,
    },
    {
      id: "feed_name",
      label: "Feed",
      type: "dropdown" as const,
      options: feeds?.map((feed) => ({
        label: feed.name,
        value: feed.id,
      })),
      className: "w-fit",
      onSearchChange: setFeedSearch,
      loading: is_feeds_loading,
    },
    {
      id: "status",
      label: "Status",
      type: "select" as const,
      options: [
        {
          label: "Active",
          value: "active",
        },
        {
          label: "Expired",
          value: "expired",
        },
      ],
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={paginated_data?.items ?? []}
      page_count={paginated_data?.metadata.page_count ?? 1}
      current_page={page}
      onPaginationChange={setPage}
      onSortingChange={setSorting}
      onFilterChange={setColumnFilters}
      filter_meta={filter_meta}
      columnFilters={columnFilters}
      isLoading={isLoading}
    />
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
