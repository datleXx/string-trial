"use client";

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

interface BillingHistoryTableProps {
  billingHistory: Array<{
    id: string;
    date: Date;
    description: string;
    amount: string;
    status: string;
    billingFrequency: "monthly" | "yearly" | null;
  }>;
}

export function BillingHistoryTable({
  billingHistory,
}: BillingHistoryTableProps) {
  if (billingHistory.length === 0) {
    return (
      <NoData
        title="No billing history"
        message="There are no items to display at this time."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Billing History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingHistory.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>
                  {new Date(bill.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{bill.description}</TableCell>
                <TableCell>${bill.amount}</TableCell>
                <TableCell>
                  <Badge
                    variant={bill.status === "paid" ? "default" : "secondary"}
                  >
                    {bill.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
