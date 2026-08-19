import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicAsset = req.nextUrl.pathname.startsWith("/branding");

  if (isApiAuth || isPublicAsset) return NextResponse.next();

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/files).*)"],
};
