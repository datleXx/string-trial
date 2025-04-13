"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

type Organization =
  RouterOutputs["subscription"]["getAll"][number]["organization"];
type Feed = RouterOutputs["subscription"]["getAll"][number]["feed"];

interface SubscriptionFormProps {
  initialData?: RouterOutputs["subscription"]["getAll"][number];
  organizations: Organization[];
  feeds: Feed[];
  onSuccess?: () => void;
}

export function SubscriptionForm({
  initialData,
  organizations,
  feeds,
  onSuccess,
}: SubscriptionFormProps) {
  const router = useRouter();
  const [form_data, setFormData] = useState(
    initialData ?? {
      organizationId: organizations[0]?.id ?? 0,
      feedId: feeds[0]?.id ?? 0,
      accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billingAmount: "0",
      billingFrequency: "monthly" as const,
      successEmails: [],
      failEmails: [],
      schemaUpdateEmails: [],
    },
  );

  const createMutation = api.subscription.create.useMutation({
    onSuccess: () => {
      router.refresh();
      onSuccess?.();
    },
  });

  const updateMutation = api.subscription.update.useMutation({
    onSuccess: () => {
      router.refresh();
      onSuccess?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      organizationId: form_data.organizationId,
      feedId: form_data.feedId,
      accessUntil: form_data.accessUntil.toISOString(),
      billingAmount: Number(form_data.billingAmount),
      billingFrequency: form_data.billingFrequency ?? "monthly",
      successEmails: form_data.successEmails ?? undefined,
      failEmails: form_data.failEmails ?? undefined,
      schemaUpdateEmails: form_data.schemaUpdateEmails ?? undefined,
    };

    if (initialData?.id) {
      await updateMutation.mutateAsync({
        id: initialData.id,
        ...submitData,
      });
    } else {
      await createMutation.mutateAsync(submitData);
    }
  };

  const handleEmailArrayChange = (
    field: "successEmails" | "failEmails" | "schemaUpdateEmails",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value.split(",").map((email) => email.trim()),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? "Update Subscription" : "Create New Subscription"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={String(form_data.organizationId)}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    organizationId: Number(value),
                  }))
                }
              >
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

            <div className="space-y-2">
              <Label htmlFor="feed">Feed</Label>
              <Select
                value={String(form_data.feedId)}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    feedId: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select feed" />
                </SelectTrigger>
                <SelectContent>
                  {feeds.map((feed) => (
                    <SelectItem key={feed.id} value={String(feed.id)}>
                      {feed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessUntil">Access Until</Label>
              <Input
                type="date"
                id="accessUntil"
                value={form_data.accessUntil.toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    accessUntil: new Date(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAmount">Billing Amount</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  id="billingAmount"
                  className="pl-7"
                  value={form_data.billingAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      billingAmount: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="successEmails">
                Success Notification Emails (comma-separated)
              </Label>
              <Input
                id="successEmails"
                value={form_data.successEmails?.join(", ")}
                onChange={(e) =>
                  handleEmailArrayChange("successEmails", e.target.value)
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="failEmails">
                Failure Notification Emails (comma-separated)
              </Label>
              <Input
                id="failEmails"
                value={form_data.failEmails?.join(", ")}
                onChange={(e) =>
                  handleEmailArrayChange("failEmails", e.target.value)
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="schemaUpdateEmails">
                Schema Update Emails (comma-separated)
              </Label>
              <Input
                id="schemaUpdateEmails"
                value={form_data.schemaUpdateEmails?.join(", ")}
                onChange={(e) =>
                  handleEmailArrayChange("schemaUpdateEmails", e.target.value)
                }
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending ?? updateMutation.isPending}
            >
              {(createMutation.isPending ?? updateMutation.isPending)
                ? "Saving..."
                : initialData?.id
                  ? "Update Subscription"
                  : "Create Subscription"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
