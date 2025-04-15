import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "~/env";

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    console.log("Middleware Debug:", {
      has_token: !!token,
      token_role: token?.role,
      token_sub: token?.sub,
      full_token: token,
      pathname: request.nextUrl.pathname,
      env: process.env.NODE_ENV,
      auth_secret_exists: !!env.AUTH_SECRET,
    });

    // Check if user is authenticated
    if (!token) {
      console.log("No token found, redirecting to signin...");
      const url = new URL("/auth/signin", request.url);
      url.searchParams.set("error", "TokenMissing");
      url.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(url);
    }

    // Check for protected admin routes
    const pathname = request.nextUrl.pathname;
    if (
      pathname.startsWith("/dashboard/admin") ||
      pathname === "/dashboard/billing"
    ) {
      if (token.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }
}

// Update the matcher to catch all dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
