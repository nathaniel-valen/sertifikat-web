// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isAdminRoute) return NextResponse.next();

  // Cek kedua kemungkinan nama cookie NextAuth
  const token =
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value ||        // ← NextAuth v5
    req.cookies.get('__Secure-authjs.session-token')?.value; // ← NextAuth v5 production

  const isLoggedIn = !!token;

  // Sudah login tapi mau ke login page → redirect ke admin
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Belum login dan bukan login page → redirect ke login
  if (!isLoginPage && !isLoggedIn) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};