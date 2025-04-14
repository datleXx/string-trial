import { type ReactNode } from "react";
import { redirect } from "next/navigation";
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
import { auth, signOut } from "~/server/auth";

async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

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
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Bell className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard/subscriptions"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <CheckSquare className="h-4 w-4" />
              Subscriptions
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4" />
                  Billing
                </Link>
                <Link
                  href="/dashboard/admin/users"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <BarChart2 className="h-4 w-4" />
                  Admin
                </Link>
              </>
            )}
            <Link
              href="/dashboard/organizations"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
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
              <p className="truncate text-sm font-medium">
                {session.user.name}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {session.user.email}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
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
