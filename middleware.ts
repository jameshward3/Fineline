import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Only the internal STITCH OS production tool requires a signed-in session.
// The public Fine Line Studio marketing site (/, /collections, /start, …)
// is unauthenticated by design.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/crm",
  "/jobs",
  "/machines",
  "/products",
  "/setups",
  "/threads",
  "/designs",
];

// The internal app and the public marketing site share this codebase but
// deploy as two separate Vercel projects. SITE_MODE (set per-project) keeps
// each deployment showing only what it should — "internal" never exposes
// the public site, "marketing" never exposes the production tool or a
// staff login. Unset (local dev, single-project setups) serves everything.
const APP_PREFIXES = [...PROTECTED_PREFIXES, "/login"];
const MARKETING_PATHS = [
  "/",
  "/about",
  "/collections",
  "/corporate",
  "/institutional",
  "/monogram-atelier",
  "/portal",
  "/process",
  "/start",
];

function isUnderPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const siteMode = process.env.SITE_MODE;

  if (siteMode === "internal") {
    if (pathname === "/") return NextResponse.redirect(new URL("/login", req.nextUrl));
    if (isUnderPrefix(pathname, MARKETING_PATHS)) return new NextResponse(null, { status: 404 });
  }
  if (siteMode === "marketing" && isUnderPrefix(pathname, APP_PREFIXES)) {
    return new NextResponse(null, { status: 404 });
  }

  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === "/login";
  const isProtected = isUnderPrefix(pathname, PROTECTED_PREFIXES);

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/files|api/auth|branding).*)"],
};
