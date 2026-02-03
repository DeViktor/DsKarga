import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  
  // Clear cookies with aggressive expiration and matching options
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  };

  res.cookies.set('sb-auth-token', '', cookieOptions);
  res.cookies.set('sb-auth-user', '', cookieOptions);
  res.cookies.set('sb-auth-iat', '', cookieOptions);
  
  return res;
}
