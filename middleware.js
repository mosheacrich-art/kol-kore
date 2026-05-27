const BLOCKED_COUNTRIES = ['IN']

export default function middleware(req) {
  const country = req.headers.get('x-vercel-ip-country')
  if (BLOCKED_COUNTRIES.includes(country)) {
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not available</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d0b1e;color:#fff"><div style="text-align:center"><h1 style="font-weight:300;font-size:2rem;margin-bottom:8px">Not available</h1><p style="color:#888">This service is not available in your region.</p></div></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

export const config = {
  // Only run on page-level routes, skip static assets
  matcher: '/((?!api/|_next/|assets/|fonts/|icons/|favicon|manifest|robots|.*\\..*$).*)',
}
