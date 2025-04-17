"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api, type RouterOutputs } from "~/trpc/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Check, MoreVertical, Trash2, Download } from "lucide-react";
import { useRoleGuard } from "~/hooks/useRoleGuard";
import { InvoiceFormDialog } from "./InvoiceFormDialog";
import toast from "react-hot-toast";
import dayjs from "dayjs";

// Helper functions
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
};

const getStatusColor = (
  status: string,
): "default" | "destructive" | "secondary" | "outline" => {
  switch (status.toLowerCase()) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  return dayjs(date).format("MMM D, YYYY");
};

const PAGE_SIZE = 10;

type Invoice = RouterOutputs["billing"]["getPaginated"]["items"][number];

export function BillingHistoryTable() {
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [organization_search, setOrganizationSearch] = useState("");
  const utils = api.useUtils();

  const { data: organizations, isLoading: is_organizations_loading } =
    api.organization.getOrganizationWithFilters.useQuery({
      global_search: organization_search,
    });

  const { data: paginated_data, isLoading } = api.billing.getPaginated.useQuery(
    {
      page,
      page_size: PAGE_SIZE,
      sorting_state: sorting[0]
        ? {
            id: sorting[0].id,
            direction: sorting[0].desc ? "desc" : "asc",
          }
        : undefined,
      filter_state: columnFilters as { id: string; value: string }[],
    },
  );

  const { user } = useRoleGuard({
    required_roles: ["admin", "viewer"],
  });

  const view_only = user?.role === "viewer";

  const updateStatusMutation = api.billing.updateInvoiceStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice status updated successfully");
      void utils.billing.getPaginated.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice status");
    },
  });

  const { mutate: deleteInvoice } = api.billing.deleteInvoice.useMutation({
    onSuccess: () => {
      void utils.billing.getPaginated.invalidate();
      toast.success("Invoice deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });

  const generatePDFMutation = api.billing.generateInvoicePDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([Buffer.from(data.content, "base64")], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF generated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  const handleMarkAsPaid = async (invoiceId: string) => {
    await updateStatusMutation.mutateAsync({
      invoiceId,
      status: "paid",
      paidAt: new Date(),
    });
  };

  const handleDelete = (invoiceId: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoice({ invoiceId });
    }
  };

  const handleDownloadPDF = (invoiceId: string) => {
    generatePDFMutation.mutate({ invoiceId });
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="font-medium">
          <div>{row.original.invoiceNumber}</div>
          <div className="text-muted-foreground text-sm font-light md:hidden">
            {formatDate(row.original.createdAt)}
          </div>
          <div className="text-muted-foreground text-sm font-light sm:hidden">
            <Badge
              className="capitalize"
              variant={getStatusColor(row.original.status)}
            >
              {row.original.status}
            </Badge>
          </div>
        </div>
      ),
      size: 192,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="hidden font-light md:block">
          {formatDate(row.original.createdAt)}
        </div>
      ),
      size: 192,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <div className="hidden font-light lg:block">
          {formatDate(row.original.dueDate)}
        </div>
      ),
      size: 192,
    },
    {
      id: "organizationToFeed.organization.name",
      accessorKey: "organizationToFeed.organization.name",
      header: "Organization",
      cell: ({ row }) => (
        <div className="font-light">
          {row.original.organizationToFeed.organization.name}
        </div>
      ),
      size: 200,
      enableSorting: false,
    },
    {
      id: "organizationToFeed.feed.name",
      accessorKey: "organizationToFeed.feed.name",
      header: "Feed",
      cell: ({ row }) => (
        <div className="font-light">
          {row.original.organizationToFeed.feed.name}
        </div>
      ),
      size: 192,
      enableSorting: false,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-light">{formatCurrency(row.original.amount)}</div>
      ),
      size: 120,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="hidden sm:block">
          <Badge
            className="capitalize"
            variant={getStatusColor(row.original.status)}
          >
            {row.original.status}
          </Badge>
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "paidAt",
      header: "Paid At",
      cell: ({ row }) => (
        <div className="hidden font-light lg:block">
          {formatDate(row.original.paidAt)}
        </div>
      ),
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleMarkAsPaid(row.original.id)}
              disabled={view_only}
            >
              <Check className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-sm text-green-600">Mark as Paid</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              disabled={view_only}
              className="text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3 text-red-600" />
              <span className="text-sm text-red-600">Delete</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDownloadPDF(row.original.id)}
              disabled={generatePDFMutation.isPending}
            >
              <Download className="mr-1 h-3 w-3" />
              <span className="text-sm">Download PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
    },
  ];

  const filter_meta = [
    {
      id: "organizationToFeed.organization.name",
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
      id: "dueDate",
      label: "Due Date",
      type: "date" as const,
    },
    {
      id: "amount",
      label: "Amount",
      type: "number" as const,
    },
    {
      id: "paidAt",
      label: "Paid At",
      type: "date" as const,
    },
    {
      id: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "Paid", value: "paid" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Billing History</CardTitle>
        {!view_only && <InvoiceFormDialog />}
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={paginated_data?.items ?? []}
          page_count={paginated_data?.metadata.page_count ?? 1}
          current_page={page}
          onPaginationChange={setPage}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onFilterChange={setColumnFilters}
          filter_meta={filter_meta}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
