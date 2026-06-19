import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware disabled for testing - all pages accessible without authentication
export function middleware(request: NextRequest) {
  // Allow all requests to pass through without authentication
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
