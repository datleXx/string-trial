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
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
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
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{invoice.organizationToFeed.feed.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={view_only}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                          <span className="text-red-600">Delete</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="text-green-600"
                          disabled={view_only}
                        >
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span className="text-green-600">Mark as Paid</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadPDF(invoice.id)}
                          disabled={generatePDFMutation.isPending}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
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
