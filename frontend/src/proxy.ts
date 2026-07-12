import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public paths that shouldn't redirect to login if not authenticated
const PUBLIC_PATHS = ["/login", "/signup", "/", "/brand-logo.svg"];

// Define paths that authenticated users should NOT be able to visit (they get redirected to dashboard)
const AUTH_RESTRICTED_PATHS = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token from cookies
  const token = request.cookies.get("token")?.value;

  const isAuthRestrictedPath = AUTH_RESTRICTED_PATHS.includes(pathname);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // If user is authenticated and trying to access login/signup, redirect to dashboard
  if (isAuthRestrictedPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is NOT authenticated and trying to access a protected route, redirect to login
  if (!isPublicPath && !token) {
    // You can optionally pass a redirect URL parameter here
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, .svg (metadata/static files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\\\.svg|.*\\\\.png).*)",
  ],
};
