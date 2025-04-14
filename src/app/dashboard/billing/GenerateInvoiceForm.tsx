"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type RouterOutputs } from "~/trpc/shared";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";

type Organization = RouterOutputs["organization"]["getAll"][number];

interface GenerateInvoiceFormProps {
  organizations: Organization[];
}

export function GenerateInvoiceForm({
  organizations,
}: GenerateInvoiceFormProps) {
  const [selected_org, setSelectedOrg] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [due_date, setDueDate] = useState<string>(
    dayjs().add(30, "day").format("YYYY-MM-DD"),
  );

  const utils = api.useUtils();

  const generateInvoiceMutation = api.billing.generateInvoice.useMutation({
    onSuccess: (invoice) => {
      toast.success(
        `Invoice ${invoice?.invoiceNumber ?? "unknown"} generated successfully!`,
      );
      // Reset form
      setSelectedOrg("");
      setAmount("");
      setDueDate(dayjs().add(30, "day").format("YYYY-MM-DD"));
      // Refresh billing history
      void utils.billing.getAllBillingHistory.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate invoice");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected_org || !amount || !due_date) {
      toast.error("Please fill in all fields");
      return;
    }

    if (dayjs(due_date).isBefore(dayjs())) {
      toast.error("Due date must be in the future");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await generateInvoiceMutation.mutateAsync({
      organizationId: selected_org,
      amount: numericAmount,
      dueDate: dayjs(due_date).toISOString(),
    });
  };

  const selected_org_name = organizations.find(
    (org) => org.id === selected_org,
  )?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization" className="text-sm font-medium">
                Organization
              </Label>
              <Select value={selected_org} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={selected_org_name ?? "Select organization"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount ($)
              </Label>
              <Input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                className="w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="Enter invoice amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </Label>
            <Input
              type="date"
              id="dueDate"
              className="w-full max-w-md"
              value={due_date}
              onChange={(e) => setDueDate(e.target.value)}
              min={dayjs().format("YYYY-MM-DD")}
              required
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={generateInvoiceMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 md:w-auto"
            >
              {generateInvoiceMutation.isPending
                ? "Generating..."
                : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
