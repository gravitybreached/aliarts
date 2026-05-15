import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      loginUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect authenticated user routes
  const protectedUserRoutes = ["/dashboard", "/profile", "/upload", "/notifications"];
  const isProtectedUserRoute = protectedUserRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedUserRoute) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/upload/:path*",
    "/notifications/:path*",
  ],
};
