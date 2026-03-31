import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ROUTES } from "@/utils/routes";
import { isAdminRole, isClientRole } from "@/lib/roles";

const isPublicRoute = createRouteMatcher([
  `${ROUTES.SIGN_IN}(.*)`,
  `${ROUTES.SIGN_UP}(.*)`,
  ROUTES.VERIFYING,
  "/(public)(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  if (isPublicRoute(req)) {
    // Signed-in user on /verifying with role → redirect to correct portal
    if (userId && pathname === ROUTES.VERIFYING) {
      const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
      if (isClientRole(role)) return NextResponse.redirect(new URL(ROUTES.CLIENT_HOME, req.url));
      if (isAdminRole(role)) return NextResponse.redirect(new URL(ROUTES.ADMIN_HOME, req.url));
    }
    return NextResponse.next();
  }

  // Not signed in → Clerk redirects to NEXT_PUBLIC_CLERK_SIGN_IN_URL
  if (!userId) await auth.protect();

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // API routes: validate auth only — never redirect to a page
  if (pathname.startsWith("/api/")) {
    if (!role) {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // No role yet → wait on /verifying for webhook to fire
  if (!role) return NextResponse.redirect(new URL(ROUTES.VERIFYING, req.url));

  // Client → /client/* only
  if (isClientRole(role)) {
    if (!pathname.startsWith("/client")) return NextResponse.redirect(new URL(ROUTES.CLIENT_HOME, req.url));
    return NextResponse.next();
  }

  // Admin/staff → /v2/* only
  if (isAdminRole(role)) {
    if (!pathname.startsWith("/v2")) return NextResponse.redirect(new URL(ROUTES.ADMIN_HOME, req.url));
    return NextResponse.next();
  }

  // Unknown role
  return NextResponse.redirect(new URL(ROUTES.SIGN_IN, req.url));
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
