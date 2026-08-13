import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fi', 'sv', 'en'];
const defaultLocale = 'fi';

// The root layout renders <html lang>, but the locale lives in a child route
// segment it cannot read. Forwarding the pathname as a header lets it derive
// the locale, so Finnish and Swedish pages stop announcing themselves as
// English to screen readers and search engines.
const withPathname = (request: NextRequest, pathname: string) => {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return withPathname(request, pathname);
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL(`/${defaultLocale}/`, request.url));
  }

  return withPathname(request, pathname);
}

export const config = {
  matcher: ['/((?!_next|static|.*\\..*|images).*)'],
};
