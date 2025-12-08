import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fi', 'sv', 'en'];
const defaultLocale = 'fi';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL(`/${defaultLocale}/`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|.*\\..*|images).*)'],
};
