"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { TableSkeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { NoData } from "~/components/ui/no-data";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "~/components/ui/modal";

function SubscriptionStatus({ accessUntil }: { accessUntil: Date }) {
  const is_active = accessUntil > new Date();
  return (
    <Badge variant={is_active ? "default" : "secondary"}>
      {is_active ? "Active" : "Expired"}
    </Badge>
  );
}

interface ViewOrganizationDialogProps {
  children: React.ReactNode;
  organizationId: string;
}

export function ViewOrganizationDialog({
  children,
  organizationId,
}: ViewOrganizationDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: organization, isLoading: isLoadingOrg } =
    api.organization.getById.useQuery(
      { id: organizationId },
      {
        enabled: open,
      },
    );

  const { data: subscriptions, isLoading: isLoadingSubs } =
    api.subscription.getByOrganization.useQuery(
      { organizationId },
      {
        enabled: open,
      },
    );

  const isLoading = isLoadingOrg || isLoadingSubs;

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="2xl">
        <ModalHeader>
          <ModalTitle>Organization Details</ModalTitle>
        </ModalHeader>

        {isLoading ? (
          <TableSkeleton />
        ) : organization ? (
          <div className="space-y-6">
            {/* Organization Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full text-xl">
                  {organization.name?.[0]?.toUpperCase() ?? "O"}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {organization.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {organization.billingEmail}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  organization.status === "active" ? "default" : "secondary"
                }
                className="text-sm"
              >
                {organization.status}
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Organization Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Created
                      </dt>
                      <dd className="mt-1 text-gray-900">
                        {organization.createdAt.toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-gray-900">
                        {organization.updatedAt?.toLocaleDateString() ??
                          "Never"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Subscription Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Subscription Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Total Subscriptions
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {subscriptions?.length ?? 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Active Subscriptions
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-green-600">
                        {subscriptions?.filter(
                          (sub) => new Date(sub.accessUntil) > new Date(),
                        ).length ?? 0}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Subscriptions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription History</CardTitle>
              </CardHeader>
              <CardContent>
                {!subscriptions?.length ? (
                  <NoData
                    title="No subscriptions found"
                    message="This organization has no subscription history."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feed</TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Status
                          </TableHead>
                          <TableHead>Billing</TableHead>
                          <TableHead className="hidden lg:table-cell">
                            Access Until
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                              {sub.feed.name}
                              <div className="text-muted-foreground text-sm sm:hidden">
                                <SubscriptionStatus
                                  accessUntil={new Date(sub.accessUntil)}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <SubscriptionStatus
                                accessUntil={new Date(sub.accessUntil)}
                              />
                            </TableCell>
                            <TableCell>
                              ${sub.billingAmount}/{sub.billingFrequency}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {new Date(sub.accessUntil).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-4 text-center text-sm">
            Organization not found
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
