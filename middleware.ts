import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fi', 'sv', 'en'];
const defaultLocale = 'fi';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Don't redirect API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Redirect root to default locale
  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    '/((?!_next|static|.*\\..*|images).*)',
  ],
};
