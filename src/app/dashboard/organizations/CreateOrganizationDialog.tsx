"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import toast from "react-hot-toast";

interface FormData {
  name: string;
  billingEmail: string;
  status: "active" | "inactive";
}

interface CreateOrganizationDialogProps {
  children: React.ReactNode;
}

export function CreateOrganizationDialog({
  children,
}: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [form_data, setFormData] = useState<FormData>({
    name: "",
    billingEmail: "",
    status: "active",
  });
  const utils = api.useUtils();

  const createMutation = api.organization.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully");
      setOpen(false);
      void utils.organization.getAll.invalidate();
    },
    onError: () => {
      toast.error("Failed to create organization");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form_data.name,
        billingEmail: form_data.billingEmail,
        status: form_data.status,
      });
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  const handleStatusChange = (value: "active" | "inactive") => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={form_data.name}
                className="font-light"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input
                id="billingEmail"
                type="email"
                value={form_data.billingEmail}
                className="font-light"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingEmail: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form_data.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="font-light">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
