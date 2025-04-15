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
import { type RouterOutputs } from "~/trpc/shared";
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

type BillingHistory = RouterOutputs["billing"]["getBillingHistory"][number];

interface BillingHistoryTableProps {
  billing_history: BillingHistory[];
}

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

export function BillingHistoryTable({
  billing_history,
}: BillingHistoryTableProps) {
  const utils = api.useUtils();
  const { data: organizations = [] } = api.organization.getAll.useQuery();

  const { user } = useRoleGuard({
    required_roles: ["admin", "viewer"],
  });

  const view_only = user?.role === "viewer";

  const updateStatusMutation = api.billing.updateInvoiceStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice status updated successfully");
      void utils.billing.getAllBillingHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice status");
    },
  });

  const { mutate: deleteInvoice } = api.billing.deleteInvoice.useMutation({
    onSuccess: () => {
      void utils.billing.getAllBillingHistory.invalidate();
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

  if (billing_history.length === 0) {
    return (
      <NoData
        title="No billing history"
        message="There are no invoices to display at this time."
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing History</CardTitle>
          {!view_only && <InvoiceFormDialog organizations={organizations} />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Feed</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing_history.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="font-light">
                    {formatDate(invoice.createdAt)}
                  </TableCell>
                  <TableCell className="font-light">
                    {formatDate(invoice.dueDate)}
                  </TableCell>
                  <TableCell className="font-light">
                    {invoice.organizationToFeed.feed.name}
                  </TableCell>
                  <TableCell className="text-right font-light">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-light">
                    {formatDate(invoice.paidAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-3 w-3" />
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
                        >
                          <Trash2 className="mr-1 h-3 w-3 text-red-600" />
                          <span className="text-sm text-red-600">Delete</span>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
