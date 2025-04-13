import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { Button } from "~/components/ui/button";
import { LogOut, User } from "lucide-react";
import { cn } from "~/lib/utils";
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
      <aside className="flex w-64 flex-col justify-between border-r bg-white px-3 py-4">
        <div className="space-y-4">
          <Link
            href="/"
            className="hover:bg-accent flex items-center gap-2 rounded-lg px-3 py-2"
          >
            <span className="font-semibold">Admin Dashboard</span>
          </Link>

          <NavigationMenu orientation="vertical" className="w-full max-w-none">
            <NavigationMenuList className="flex-col items-start space-y-1">
              <NavigationMenuItem className="w-full">
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "hover:bg-accent w-full justify-start rounded-lg px-3 py-2",
                  )}
                >
                  <Link href="/dashboard">Overview</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem className="w-full">
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "hover:bg-accent w-full justify-start rounded-lg px-3 py-2",
                  )}
                >
                  <Link href="/dashboard/subscriptions">Subscriptions</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem className="w-full">
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "hover:bg-accent w-full justify-start rounded-lg px-3 py-2",
                  )}
                >
                  <Link href="/dashboard/billing">Billing</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem className="w-full">
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "hover:bg-accent w-full justify-start rounded-lg px-3 py-2",
                  )}
                >
                  <Link href="/dashboard/organizations">Organizations</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {isAdmin && (
                <NavigationMenuItem className="w-full">
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "hover:bg-accent w-full justify-start rounded-lg px-3 py-2",
                    )}
                  >
                    <Link href="/dashboard/admin/users">Users</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="space-y-4">
          <div className="border-t" />
          <div className="flex items-center gap-3 px-3">
            <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-full">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="text-muted-foreground h-5 w-5" />
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
              className="hover:bg-accent w-full justify-start gap-2 rounded-lg px-3 py-2"
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
