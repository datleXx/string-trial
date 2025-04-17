"use client";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";

import { ViewOrganizationDialog } from "./ViewOrganizationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { useState } from "react";

import type {
  SortingState,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "~/components/ui/data-table/data-table";
import type { FilterMeta } from "~/components/ui/data-table/types";

const PAGE_SIZE = 10;

export default function OrganizationsPage() {
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading } = api.organization.getPaginated.useQuery({
    page,
    page_size: PAGE_SIZE,
    sorting_state: {
      id: sorting[0]?.id ?? "",
      direction: sorting[0]?.desc ? "desc" : "asc",
    },
    column_filters: columnFilters as {
      id: string;
      value: string | { from: number; to: number };
    }[],
  });
  const utils = api.useUtils();

  const deleteMutation = api.organization.delete.useMutation({
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      void utils.organization.getPaginated.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete organization");
    },
  });

  const handleDelete = (orgId: string) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      deleteMutation.mutate({ id: orgId });
    }
  };

  const columns: ColumnDef<
    RouterOutputs["organization"]["getPaginated"]["items"][number]
  >[] = [
    {
      header: "Name", // the id will act as the global for this column TODO: fix this
      accessorKey: "name",
      cell: ({ row }) => <div className="truncate">{row.original.name}</div>,
      size: 150,
    },
    {
      header: "Billing Email",
      accessorKey: "billingEmail",
      cell: ({ row }) => (
        <div className="truncate">{row.original.billingEmail}</div>
      ),
      size: 180,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "secondary"}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
      size: 120,
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <div>{row.original.createdAt.toLocaleDateString()}</div>
      ),
      size: 120,
    },
    {
      header: "Updated",
      accessorKey: "updatedAt",
      cell: ({ row }) => (
        <div>{row.original.updatedAt?.toLocaleDateString() ?? "Never"}</div>
      ),
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ViewOrganizationDialog organizationId={row.original.id}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Eye className="mr-1 h-3 w-3" />
                  <span className="text-sm">View</span>
                </DropdownMenuItem>
              </ViewOrganizationDialog>
              <DropdownMenuItem onClick={() => handleDelete(row.original.id)}>
                <Trash2 className="mr-1 h-3 w-3 text-red-600" />
                <span className="text-sm text-red-600">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      size: 80,
    },
  ];

  const filter_meta: FilterMeta[] = [
    {
      id: "name",
      label: "",
      type: "text",
      placeholder: "Search organizations...",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      id: "createdAt",
      label: "Created",
      type: "date",
    },
    {
      id: "updatedAt",
      label: "Updated",
      type: "date",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2 font-light">
          Manage and monitor organizations across the platform.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        page_count={data?.metadata.page_count ?? 0}
        current_page={page}
        columnFilters={columnFilters}
        onPaginationChange={setPage}
        onSortingChange={setSorting}
        onFilterChange={setColumnFilters}
        filter_meta={filter_meta}
        isLoading={isLoading}
      />
    </div>
  );
}
