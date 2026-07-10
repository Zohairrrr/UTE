import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set(configured);
}

function isAllowedOrigin(request: NextRequest) {
  if (!mutatingMethods.has(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestOrigin = request.nextUrl.origin.replace(/\/$/, "");
  return origin === requestOrigin || allowedOrigins().has(origin.replace(/\/$/, ""));
}

export async function middleware(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("urban_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session?.role !== "ADMIN") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
