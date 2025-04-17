"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import { Checkbox } from "~/components/ui/checkbox";
import { Combobox } from "~/components/ui/combobox";

export function GenerateInvoiceForm() {
  const [global_search, setGlobalSearch] = useState<string>("");
  const { data: organizations = [], isLoading } =
    api.organization.getOrganizationWithFilters.useQuery({
      global_search: global_search,
    });
  const [selected_org, setSelectedOrg] = useState<string>("");
  const [selected_subscriptions, setSelectedSubscriptions] = useState<string[]>(
    [],
  );
  const [amount, setAmount] = useState<string>("");
  const [send_email, setSendEmail] = useState<boolean>(false);
  const [manual_email, setManualEmail] = useState<string>("");
  const [change_email, setChangeEmail] = useState<boolean>(false);
  const [due_date, setDueDate] = useState<string>(
    dayjs().add(30, "day").format("YYYY-MM-DD"),
  );

  const utils = api.useUtils();

  // Fetch subscriptions for selected organization
  const { data: subscriptions = [] } =
    api.subscription.getByOrganization.useQuery(
      { organizationId: selected_org },
      { enabled: !!selected_org },
    );

  // Calculate total amount when subscriptions are selected
  useEffect(() => {
    if (selected_subscriptions.length > 0) {
      const total = subscriptions
        .filter((sub) => selected_subscriptions.includes(sub.id))
        .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);
      setAmount(total.toString());
    }
  }, [selected_subscriptions, subscriptions]);

  const generateInvoiceMutation = api.billing.generateInvoice.useMutation({
    onSuccess: (invoice) => {
      toast.success(
        `Invoice ${invoice?.invoiceNumber ?? "unknown"} generated successfully!`,
      );
      // Reset form
      setSelectedOrg("");
      setSelectedSubscriptions([]);
      setAmount("");
      setDueDate(dayjs().add(30, "day").format("YYYY-MM-DD"));
      setSendEmail(false);
      setManualEmail("");
      setChangeEmail(false);
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

    if (selected_subscriptions.length === 0) {
      toast.error("Please select at least one subscription");
      return;
    }

    if (dayjs(due_date).isBefore(dayjs())) {
      toast.error("Due date must be in the future");
      return;
    }

    const numeric_amount = parseFloat(amount);
    if (isNaN(numeric_amount) || numeric_amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (manual_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manual_email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    await generateInvoiceMutation.mutateAsync({
      organizationId: selected_org,
      subscriptionIds:
        selected_subscriptions.length > 0 ? selected_subscriptions : undefined,
      amount: numeric_amount,
      dueDate: dayjs(due_date).toISOString(),
      sendEmail: send_email,
      emailOverride: manual_email,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="organization" className="text-sm font-medium">
            Organization
          </Label>
          <Combobox
            options={organizations.map((org) => ({
              value: org.id,
              label: org.name,
            }))}
            value={selected_org}
            onChange={(value) => setSelectedOrg(value as string)}
            onSearchChange={(search) => {
              setGlobalSearch(search);
            }}
            loading={isLoading}
          />
        </div>

        {selected_org && subscriptions.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Subscriptions</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center space-x-2 rounded-lg border p-3"
                >
                  <Checkbox
                    id={sub.id}
                    checked={selected_subscriptions.includes(sub.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSubscriptions([
                          ...selected_subscriptions,
                          sub.id,
                        ]);
                      } else {
                        setSelectedSubscriptions(
                          selected_subscriptions.filter((id) => id !== sub.id),
                        );
                      }
                    }}
                  />
                  <Label htmlFor={sub.id} className="text-sm font-light">
                    {sub.feed.name} - ${sub.billingAmount}/
                    {sub.billingFrequency}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount ($)
            </Label>
            <Input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              className="font-light"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Enter invoice amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </Label>
            <Input
              type="date"
              id="dueDate"
              className="font-light"
              value={due_date}
              onChange={(e) => setDueDate(e.target.value)}
              required
              min={dayjs().format("YYYY-MM-DD")}
            />
          </div>
        </div>
      </div>

      {(selected_org || manual_email) && (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={send_email}
            onCheckedChange={(checked) => setSendEmail(checked as boolean)}
          />
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-light">
              Send invoice to{" "}
              {!change_email ? (
                <span className="font-medium">
                  {manual_email
                    ? manual_email
                    : organizations.find((org) => org.id === selected_org)
                        ?.name}
                </span>
              ) : (
                <Input
                  type="email"
                  onBlur={() => {
                    setChangeEmail(false);
                  }}
                  value={manual_email}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="ml-1 inline-block w-fit"
                />
              )}
              <span
                className="cursor-pointer text-xs font-light text-gray-500 underline"
                onClick={() => {
                  setChangeEmail(!change_email);
                }}
              >
                {change_email ? "Cancel" : "Change?"}
              </span>
            </Label>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={generateInvoiceMutation.isPending}
          className="w-full sm:w-auto"
        >
          {generateInvoiceMutation.isPending ? "Generating..." : "Generate"}
        </Button>
      </div>
    </form>
  );
}
