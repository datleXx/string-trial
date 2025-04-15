"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import toast from "react-hot-toast";

type Organization =
  RouterOutputs["subscription"]["getAll"][number]["organization"];
type Feed = RouterOutputs["subscription"]["getAll"][number]["feed"];

interface SubscriptionFormProps {
  initial_data?: RouterOutputs["subscription"]["getAll"][number];
  organizations: Organization[];
  feeds: Feed[];
  onSuccess?: () => void;
  className?: string;
}

export function SubscriptionForm({
  initial_data,
  organizations,
  feeds,
  onSuccess,
  className,
}: SubscriptionFormProps) {
  const router = useRouter();
  const [form_data, setFormData] = useState(
    initial_data ?? {
      organizationId: organizations[0]?.id ?? "",
      feedId: feeds[0]?.id ?? "",
      accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billingAmount: "0",
      billingFrequency: "monthly" as "monthly" | "yearly",
      successEmails: [],
      failEmails: [],
      schemaUpdateEmails: [],
    },
  );

  const [existing_subscription, setExistingSubscription] = useState<
    RouterOutputs["subscription"]["getByOrganization"][number] | null
  >(null);

  // Query to check for existing subscriptions
  const { data: org_subscriptions } =
    api.subscription.getByOrganization.useQuery(
      { organizationId: form_data.organizationId },
      {
        enabled: !!form_data.organizationId,
      },
    );

  // Check for existing subscription whenever orgSubscriptions or feedId changes
  useEffect(() => {
    if (org_subscriptions) {
      const existing = org_subscriptions.find(
        (sub) => sub.feedId === form_data.feedId,
      );
      setExistingSubscription(existing ?? null);
    }
  }, [org_subscriptions, form_data.feedId]);

  const createMutation = api.subscription.create.useMutation({
    onSuccess: () => {
      toast.success("Subscription created successfully");
      router.push(`/dashboard/subscriptions`);
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to create subscription");
    },
  });

  const updateMutation = api.subscription.update.useMutation({
    onSuccess: () => {
      toast.success("Subscription updated successfully");
      router.push(`/dashboard/subscriptions`);
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to update subscription");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      isNaN(Number(form_data.billingAmount)) ||
      Number(form_data.billingAmount) < 0
    ) {
      toast.error("Billing amount must be a number greater than 0");
      return;
    }

    const submit_data = {
      organizationId: form_data.organizationId,
      feedId: form_data.feedId,
      accessUntil: form_data.accessUntil.toISOString(),
      billingAmount: Number(form_data.billingAmount),
      billingFrequency: form_data.billingFrequency ?? "monthly",
      successEmails: form_data.successEmails ?? undefined,
      failEmails: form_data.failEmails ?? undefined,
      schemaUpdateEmails: form_data.schemaUpdateEmails ?? undefined,
    };

    if (initial_data?.id) {
      await updateMutation.mutateAsync({
        id: initial_data.id,
        ...submit_data,
      });
    } else {
      await createMutation.mutateAsync(submit_data);
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

  const content = (
    <form onSubmit={handleSubmit} className="mt-2 space-y-6 p-2">
      {existing_subscription && !initial_data?.id && (
        <div className="-mt-2 rounded-lg border border-red-500 bg-red-50 p-2 text-sm text-red-600">
          This organization already has an active subscription to this feed
          (expires{" "}
          {new Date(existing_subscription.accessUntil).toLocaleDateString()}).
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Select
            value={String(form_data.organizationId)}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                organizationId: value,
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
                feedId: value,
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
              step="0.01"
              min="0"
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

        <div className="space-y-2">
          <Label htmlFor="billingFrequency">Billing Frequency</Label>
          <Select
            value={form_data.billingFrequency ?? "monthly"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                billingFrequency: value as "monthly" | "yearly",
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select billing frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="successEmails">Success Notification Emails</Label>
          <Input
            id="successEmails"
            placeholder="Enter comma-separated email addresses"
            value={form_data.successEmails?.join(", ")}
            onChange={(e) =>
              handleEmailArrayChange("successEmails", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="failEmails">Failure Notification Emails</Label>
          <Input
            id="failEmails"
            placeholder="Enter comma-separated email addresses"
            value={form_data.failEmails?.join(", ")}
            onChange={(e) =>
              handleEmailArrayChange("failEmails", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schemaUpdateEmails">Schema Update Emails</Label>
          <Input
            id="schemaUpdateEmails"
            placeholder="Enter comma-separated email addresses"
            value={form_data.schemaUpdateEmails?.join(", ")}
            onChange={(e) =>
              handleEmailArrayChange("schemaUpdateEmails", e.target.value)
            }
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={() => onSuccess?.()} type="button">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            (createMutation.isPending ?? updateMutation.isPending) ||
            (existing_subscription && !initial_data?.id ? true : false)
          }
        >
          {(createMutation.isPending ?? updateMutation.isPending)
            ? "Saving..."
            : initial_data?.id
              ? "Update Subscription"
              : "Create Subscription"}
        </Button>
      </div>
    </form>
  );

  if (className) {
    return content;
  }

  return <div>{content}</div>;
}
