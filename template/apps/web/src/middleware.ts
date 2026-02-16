import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/app(.*)']);
const isOrgScopedRoute = createRouteMatcher(['/app/o/(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  if (isOrgScopedRoute(request)) {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
