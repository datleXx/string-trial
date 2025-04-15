"use client";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import Link from "next/link";
import { NoData } from "~/components/ui/no-data";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { TableSkeleton } from "~/components/ui/skeleton";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { ViewOrganizationDialog } from "./ViewOrganizationDialog";

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = api.organization.getAll.useQuery();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2 font-light">
          Manage and monitor organizations across the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Organizations</CardTitle>
            <div className="flex gap-4">
              <CreateOrganizationDialog>
                <Button className="w-full sm:w-auto">
                  <Building2 className="mr-2 h-4 w-4" />
                  New Organization
                </Button>
              </CreateOrganizationDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : organizations?.length === 0 ? (
            <NoData
              title="No organizations found"
              message="You can create a new organization by clicking the button above."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Billing Email
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                            {org.name?.[0]?.toUpperCase() ?? "O"}
                          </div>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-muted-foreground text-sm font-light md:hidden">
                              {org.billingEmail}
                            </div>
                            <div className="text-muted-foreground text-xs font-light">
                              ID: {org.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-light md:table-cell">
                        {org.billingEmail}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={
                            org.status === "active" ? "default" : "secondary"
                          }
                        >
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-light lg:table-cell">
                        {org.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden font-light lg:table-cell">
                        {org.updatedAt?.toLocaleDateString() ?? "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ViewOrganizationDialog organizationId={org.id}>
                          <Button variant="outline" size="sm">
                            <span className="hidden text-xs sm:inline">
                              View
                            </span>
                          </Button>
                        </ViewOrganizationDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
