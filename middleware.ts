import { NextRequest, NextResponse } from "next/server";

// HTTP Basic Auth gate for the entire app.
// Set APP_PASSWORD as an env var; the browser will prompt once per session.
export function middleware(req: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return new NextResponse(
      "APP_PASSWORD env var is not configured on the server.",
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice("Basic ".length));
      const sep = decoded.indexOf(":");
      const provided = sep === -1 ? decoded : decoded.slice(sep + 1);
      if (provided === expected) return NextResponse.next();
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Snap & Track"' },
  });
}

// Protect everything except Next internals and static asset files.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf)$).*)",
  ],
};
