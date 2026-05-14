import { NextResponse } from 'next/server'

const BLOCKED_COUNTRIES = ['IN']

export function middleware(req) {
  const country = req.geo?.country || req.headers.get('x-vercel-ip-country')
  if (BLOCKED_COUNTRIES.includes(country)) {
    return new NextResponse(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not available</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d0b1e;color:#fff"><div style="text-align:center"><h1 style="font-weight:300;font-size:2rem;margin-bottom:8px">Not available</h1><p style="color:#888">This service is not available in your region.</p></div></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/webhook-dodo|_next/static|_next/image|favicon.ico).*)'],
}
