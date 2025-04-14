"use client";

import { useState } from "react";
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
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const generateInvoiceMutation = api.billing.generateInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice generated and sent successfully!");
      // Reset form
      setSelectedOrg("");
      setStartDate("");
      setEndDate("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate invoice");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !startDate || !endDate) {
      toast.error("Please fill in all fields");
      return;
    }

    await generateInvoiceMutation.mutateAsync({
      organizationId: selectedOrg,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                className="w-fit"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                className="w-fit"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={generateInvoiceMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
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
