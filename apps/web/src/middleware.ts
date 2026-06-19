import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const middleware = withAuth(
  function middleware(req) {
    // Check if user is trying to access dashboard without authentication
    if (req.nextUrl.pathname.startsWith("/dashboard") && !req.nextauth.token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Check if authenticated user is trying to access auth pages
    if (
      req.nextUrl.pathname.startsWith("/auth") &&
      req.nextauth.token
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
