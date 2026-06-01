export default function middleware(req) {
  // No country blocking
}

export const config = {
  matcher: '/((?!api/|_next/|assets/|fonts/|icons/|favicon|manifest|robots|.*\\..*$).*)',
}
