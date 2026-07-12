import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "./src/core/config/env";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(env.storageKeys.accessToken)?.value;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/forgot-password");
  const isProtectedPage = pathname.startsWith("/dashboard") || pathname === "/";

  // If trying to access a protected page without a token, redirect to login
  if (isProtectedPage && !token) {
    const loginUrl = new URL("/login", request.url);
    // Remember where the user was heading
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/forgot-password, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow next handler
  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - next.svg, vercel.svg (images/logos)
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)"],
};
