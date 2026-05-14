const BLOCKED_COUNTRIES = ['IN']

export default function middleware(req) {
  const country = req.headers.get('x-vercel-ip-country')
  if (BLOCKED_COUNTRIES.includes(country)) {
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not available</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d0b1e;color:#fff"><div style="text-align:center"><h1 style="font-weight:300;font-size:2rem;margin-bottom:8px">Not available</h1><p style="color:#888">This service is not available in your region.</p></div></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }
  return new Response(null, { status: 200, headers: { 'x-middleware-next': '1' } })
}

export const config = {
  matcher: '/((?!api/webhook-dodo).*)',
}
