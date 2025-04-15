import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "~/env";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
  });

  console.log("Middleware Debug:", {
    has_token: !!token,
    token_role: token?.role,
    token_sub: token?.sub,
    full_token: token,
    pathname: request.nextUrl.pathname,
  });

  // Check if user is authenticated
  if (!token) {
    console.log("Redirecting to signin page...");
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", request.url);
    const response = NextResponse.redirect(url);
    console.log("Redirect URL:", url.toString());
    return response;
  }

  // Check for protected admin routes
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/dashboard/billing" ||
    pathname === "/dashboard/admin/users"
  ) {
    if (token.role !== "admin") {
      console.log("Redirecting to dashboard page...");
      console.log("Token:", token);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/billing", "/dashboard/admin/users"],
};
