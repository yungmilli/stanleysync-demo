import nextAuthMiddleware from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const middleware = nextAuthMiddleware({
  pages: {
    signIn: "/login",
  },
});

const INTERNAL_CALOPS_PATHS = [
  "/admin/calops",
  "/admin/assets",
  "/admin/procedures",
  "/admin/standards",
  "/admin/work-orders",
  "/admin/certificates",
  "/admin/integrations/calops",
];

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;
  const isInternalCalOpsPath = INTERNAL_CALOPS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isInternalCalOpsPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const labsEnabled = process.env.ENABLE_LABS_MODULE === "true";
    if (token && (token.role !== "SYSTEM_OWNER" || !labsEnabled)) {
      return NextResponse.redirect(new URL("/admin/apps?module=stanleysync-labs-coming-soon", request.url));
    }
  }

  return middleware(request as never, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
