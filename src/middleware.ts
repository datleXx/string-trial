import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "~/env";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  // Check if user is authenticated
  if (!token) {
    const url = new URL("/api/auth/signin", request.url);
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }

  // Check for admin routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // If user is not an admin, redirect to dashboard
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
