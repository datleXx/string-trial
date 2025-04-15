"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { SubscriptionForm } from "~/app/_components/SubscriptionForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface SubscriptionDialogProps {
  children: React.ReactNode;
  mode: "create" | "update";
  initial_data?: RouterOutputs["subscription"]["getAll"][number];
}

export function SubscriptionDialog({
  children,
  mode,
  initial_data,
}: SubscriptionDialogProps) {
  const [open, setOpen] = useState(false);

  // Fetch organizations and feeds for the form
  const { data: organizations = [] } = api.organization.getAll.useQuery();
  const { data: feeds = [] } = api.feed.getAll.useQuery();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogTitle>
          {mode === "create" ? "Create New Subscription" : "Update Subscription"}
        </DialogTitle>
        <SubscriptionForm
          organizations={organizations}
          feeds={feeds}
          onSuccess={() => setOpen(false)}
          initial_data={initial_data}
        />
      </DialogContent>
    </Dialog>
  );
}
