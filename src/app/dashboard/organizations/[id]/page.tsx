import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { NoData } from "~/components/ui/no-data";

function SubscriptionStatus({ accessUntil }: { accessUntil: Date }) {
  const isActive = accessUntil > new Date();
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Expired"}
    </Badge>
  );
}

interface OrganizationPageProps {
  params: {
    id: string;
  };
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const organizationId = parseInt(params.id);

  if (isNaN(organizationId)) {
    notFound();
  }

  const [organization, subscriptions] = await Promise.all([
    api.organization.getById({ id: organizationId }),
    api.subscription.getByOrganization({ organizationId }),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:py-10">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {organization.name}
          </h1>
          <p className="mt-2 text-gray-600">{organization.billingEmail}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/organizations">Back</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Basic information about the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      organization.status === "active" ? "default" : "secondary"
                    }
                  >
                    {organization.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-gray-900">
                  {organization.createdAt.toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Last Updated
                </dt>
                <dd className="mt-1 text-gray-900">
                  {organization.updatedAt?.toLocaleDateString() ?? "Never"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Summary</CardTitle>
            <CardDescription>Overview of active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Total Subscriptions
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">
                  {subscriptions.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Active Subscriptions
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-green-600 sm:text-3xl">
                  {
                    subscriptions.filter(
                      (sub) => new Date(sub.accessUntil) > new Date(),
                    ).length
                  }
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
          <CardDescription>
            Complete history of all subscriptions for this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
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
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/subscriptions/${sub.id}`}>
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">Edit</span>
                          </Link>
                        </Button>
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
