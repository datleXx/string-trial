import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Shield, Mail } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // Redirect unauthenticated users to sign in
  if (!session?.user) {
    redirect("/api/auth/signin");
  } else {
    redirect("/dashboard");
  }
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Background pattern */}
      <div className="bg-grid-gray-900/[0.04] absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,50%,white)]" />

      {/* Animated blur circles */}
      <div className="absolute -top-20 -left-20 h-[400px] w-[400px] animate-pulse rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute -right-20 -bottom-20 h-[400px] w-[400px] animate-pulse rounded-full bg-blue-500/20 blur-3xl" />

      {/* Main blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
              Access Restricted
            </h1>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-gray-600">
              You are not authorized to access this admin portal. Please contact
              our administrator for access permissions.
            </p>

            <div className="rounded-lg bg-gray-50/50 p-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-900">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:dat91fitz@gmail.com"
                  className="hover:text-blue-600 hover:underline"
                >
                  dat91fitz@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full transition-all hover:bg-gray-100"
            >
              <Link href="/api/auth/signout">Sign out</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
