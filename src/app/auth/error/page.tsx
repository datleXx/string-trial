"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const search_params = useSearchParams();
  const error = search_params.get("error");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-red-600">
          Authentication Error
        </CardTitle>
        <CardDescription>
          {error === "AccessDenied"
            ? "You do not have permission to access this application."
            : error === "Configuration"
              ? "There is a problem with the authentication configuration. Please contact your administrator."
              : "There was a problem signing you in."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild>
          <Link href="/auth/signin">Try Again</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AuthError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
