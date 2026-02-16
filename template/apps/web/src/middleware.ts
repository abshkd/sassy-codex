import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/app(.*)']);
const isOrgScopedRoute = createRouteMatcher(['/app/o/(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId, orgId, redirectToSignIn } = await auth();

  if (isProtectedRoute(request) && !userId) {
    return redirectToSignIn();
  }

  if (isOrgScopedRoute(request) && !orgId) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};
