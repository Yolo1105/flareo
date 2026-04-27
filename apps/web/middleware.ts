import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

/**
 * Middleware guard for /app/*.
 *
 * Unauthenticated users get redirected to /login with the original path
 * preserved as callbackUrl so NextAuth can send them back after login.
 *
 * /app/admin additionally requires role === "admin" on the session user.
 *
 * We deliberately do NOT protect /api/auth/* here, since that path is
 * how users log in in the first place.
 */

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

  // /@username → /u/username rewrite. Keeps the pretty URL in the
  // address bar while the underlying Next route lives at /u/[username]
  // (Next.js doesn't allow a literal `@` in a directory name without
  // it being interpreted as a route group). This fires before any
  // auth gating so public profile pages stay public.
  if (nextUrl.pathname.startsWith("/@")) {
    const handle = nextUrl.pathname.slice(2).split("/")[0];
    // Basic shape gate — avoid rewriting /@ (empty) or /@something/other.
    // The profile page itself returns 404 if the username format
    // doesn't match the stricter /lib/validation/username rules.
    if (handle && /^[A-Za-z0-9][A-Za-z0-9-]{2,29}$/.test(handle)) {
      const rest = nextUrl.pathname.slice(`/@${handle}`.length);
      const rewriteUrl = new URL(
        `/u/${handle.toLowerCase()}${rest}`,
        nextUrl,
      );
      rewriteUrl.search = nextUrl.search;
      return NextResponse.rewrite(rewriteUrl);
    }
    // Malformed handle → let Next's normal 404 handling take over.
    return NextResponse.next();
  }

  const isAppRoute = nextUrl.pathname.startsWith("/app");
  const isAdminRoute = nextUrl.pathname.startsWith("/app/admin");

  // Every /api/* route authenticates itself inline — middleware does
  // NOT gate /api/*. We deliberately keep /api/* out of the matcher
  // below so an unauthenticated API request reaches the route handler
  // directly and gets the right JSON-shaped 401/403 response instead
  // of a generic middleware redirect.

  if (!isAppRoute) return NextResponse.next();

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !isAdmin) {
    const homeUrl = new URL("/app", nextUrl);
    homeUrl.searchParams.set("error", "admin_only");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

/**
 * Run middleware on /app/* (auth gating) and /@handle/* (rewrite to
 * /u/handle). API routes are intentionally excluded — each route
 * handler authenticates inline and returns its own JSON-shaped error
 * response rather than a redirect.
 */
export const config = {
  matcher: ["/app/:path*", "/@:handle*"],
};
