"use client";

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

type Organization = RouterOutputs["organization"]["getAll"][number];

interface GenerateInvoiceFormProps {
  organizations: Organization[];
}

export function GenerateInvoiceForm({
  organizations,
}: GenerateInvoiceFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input type="date" id="startDate" className="w-fit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input type="date" id="endDate" className="w-fit" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Generate Invoice</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
