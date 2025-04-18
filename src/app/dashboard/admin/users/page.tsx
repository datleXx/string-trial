"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { NoData } from "~/components/ui/no-data";
import { useRoleGuard } from "~/hooks/useRoleGuard";
import { TableSkeleton } from "~/components/ui/skeleton";

export default function AdminUsersPage() {
  const router = useRouter();
  const [search_query, setSearchQuery] = useState("");

  const { user } = useRoleGuard({
    required_roles: ["admin", "viewer"],
  });

  const view_only = user?.role === "viewer";

  const { data: users, isLoading: users_loading } =
    api.admin.getAllUsers.useQuery(undefined);

  const utils = api.useUtils();

  const updateRole = api.admin.updateUserRole.useMutation({
    onSuccess: async () => {
      toast.success("User role updated successfully");
      void utils.admin.getUserDetails.invalidate({ userId: user?.id });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filtered_users = users?.filter(
    (user) =>
      user.name?.toLowerCase().includes(search_query.toLowerCase()) ??
      user.email.toLowerCase().includes(search_query.toLowerCase()),
  );

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "user" | "viewer",
  ) => {
    // Optimistically update the user's role
    utils.admin.getAllUsers.setData(undefined, (oldData) => {
      return oldData?.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      );
    });

    await updateRole.mutateAsync({ userId, role: newRole });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2 font-light">
          Manage user roles and monitor user activity across the platform.
        </p>
      </div>

      {users_loading ? (
        <TableSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              <div className="w-72">
                <Input
                  placeholder="Search users..."
                  value={search_query}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!filtered_users?.length ? (
              <NoData
                title="No users found"
                message="No users match your search criteria."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered_users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name ?? ""}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                              {user.name?.[0]?.toUpperCase() ??
                                user.email[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground text-sm font-light">
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-light">{user.email}</TableCell>
                      <TableCell className="font-light">
                        <Select
                          value={user.role}
                          onValueChange={(value: "admin" | "user") =>
                            handleRoleChange(user.id, value)
                          }
                        >
                          <SelectTrigger
                            disabled={view_only}
                            className="w-[110px]"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-light">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin"
                              ? "default"
                              : user.role === "viewer"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {user.role === "admin"
                            ? "Admin"
                            : user.role === "viewer"
                              ? "Viewer"
                              : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/users/${user.id}`)
                          }
                          className="text-xs"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
