// middleware.ts  ← letakkan di ROOT project (sejajar dengan /app)
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isLoginPage = nextUrl.pathname === '/admin/login';

  // Kalau belum login dan mau akses /admin/* (kecuali login page) → redirect ke login
  if (isAdminRoute && !isLoginPage && !isLoggedIn) {
    const loginUrl = new URL('/admin/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Kalau sudah login dan mau ke halaman login → redirect ke dashboard
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Jalankan middleware hanya di route /admin/*
  matcher: ['/admin/:path*'],
};