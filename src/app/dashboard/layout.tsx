"use client";
import { type ReactNode, useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  LogOut,
  User,
  Bell,
  CheckSquare,
  FileText,
  Mail,
  BarChart2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRoleGuard } from "~/hooks/useRoleGuard";
import { cn } from "~/lib/utils";
function DashboardLayout({ children }: { children: ReactNode }) {
  const { is_authenticated, user, is_loading } = useRoleGuard({
    required_roles: ["admin", "user", "viewer"],
  });

  const pathname = usePathname();

  const has_elevated_access = ["admin", "viewer"].includes(user?.role ?? "");

  useEffect(() => {
    if (!is_authenticated && !is_loading) {
      redirect("/auth/signin");
    }
  }, [is_authenticated, is_loading]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r bg-white">
        <div>
          {/* Logo/Header */}
          <div className="border-b p-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold">Admin Portal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 p-3">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-100",
                pathname === "/dashboard" && "bg-gray-100",
              )}
            >
              <Bell className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard/subscriptions"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-100",
                pathname === "/dashboard/subscriptions" && "bg-gray-100",
              )}
            >
              <CheckSquare className="h-4 w-4" />
              Subscriptions
            </Link>
            {has_elevated_access && (
              <>
                <Link
                  href="/dashboard/billing"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-100",
                    pathname === "/dashboard/billing" && "bg-gray-100",
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Billing
                </Link>
                <Link
                  href="/dashboard/admin/users"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-100",
                    pathname === "/dashboard/admin/users" && "bg-gray-100",
                  )}
                >
                  <BarChart2 className="h-4 w-4" />
                  Admin
                </Link>
              </>
            )}
            <Link
              href="/dashboard/organizations"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-light text-gray-700 hover:bg-gray-100",
                pathname === "/dashboard/organizations" && "bg-gray-100",
              )}
            >
              <Mail className="h-4 w-4" />
              Organizations
            </Link>
          </nav>
        </div>

        {/* User section */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-3">
            <div className="bg-muted relative h-8 w-8 overflow-hidden rounded-full">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="text-muted-foreground h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="text-muted-foreground truncate text-xs font-light">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
