"use client";

import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { NoData } from "~/components/ui/no-data";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Check, MoreVertical, Trash2, Download } from "lucide-react";
import { useRoleGuard } from "~/hooks/useRoleGuard";
import { InvoiceFormDialog } from "./InvoiceFormDialog";
import { useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { PaginationControls } from "~/app/_components/PaginationControls";

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

export function BillingHistoryTable() {
  const [page, setPage] = useState(1);
  const utils = api.useUtils();

  const { data: paginated_data, isLoading } = api.billing.getPaginated.useQuery(
    {
      page,
      page_size: PAGE_SIZE,
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Billing History</CardTitle>
        {!view_only && <InvoiceFormDialog />}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                <TableHead>Feed</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Paid At</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-[80px]" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-[80px]" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !paginated_data || paginated_data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <NoData
                      title="No billing history"
                      message="There are no invoices to display at this time."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginated_data.items.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div>
                        {invoice.invoiceNumber}
                        <div className="text-muted-foreground text-sm font-light md:hidden">
                          {formatDate(invoice.createdAt)}
                        </div>
                        <div className="text-muted-foreground text-sm font-light sm:hidden">
                          <Badge
                            className="capitalize"
                            variant={getStatusColor(invoice.status)}
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-light md:table-cell">
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell className="hidden font-light lg:table-cell">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="font-light">
                      {invoice.organizationToFeed.feed.name}
                    </TableCell>
                    <TableCell className="text-right font-light">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        className="capitalize"
                        variant={getStatusColor(invoice.status)}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden font-light lg:table-cell">
                      {formatDate(invoice.paidAt)}
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={view_only}
                          >
                            <Check className="mr-1 h-3 w-3 text-green-600" />
                            <span className="text-sm text-green-600">
                              Mark as Paid
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(invoice.id)}
                            disabled={view_only}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            <span className="text-sm">Delete</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadPDF(invoice.id)}
                            disabled={generatePDFMutation.isPending}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            <span className="text-sm">Download PDF</span>
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
