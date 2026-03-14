import { next, rewrite } from '@vercel/edge';

/**
 * Omnora OS Edge Middleware
 * Handles multi-tenant routing for custom domains.
 */

const PLATFORM_DOMAINS = [
  'localhost',
  'omnora.com',
  'omnora.vercel.app',
  'omnora-os.vercel.app',
  '127.0.0.1'
];

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals - if any)
     * - _vercel (Vercel internals)
     * - static (static files)
     * - favicon.ico, sitemap.xml, robots.txt (common files)
     */
    '/((?!api|_next|_vercel|static|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

export default function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';

  // 1. Skip platform domains & subdomains of platform domains
  const isPlatform = PLATFORM_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (isPlatform) {
    // Standard routing: /store/slug remains /store/slug
    return next();
  }

  // 2. Custom Domain detected: Rewrite internally to /_sites/[hostname]
  // This allows the frontend to resolve the tenant without changing the browser URL.
  const path = url.pathname;
  
  // Prevent infinite loops if the path already starts with /_sites/
  if (path.startsWith('/_sites')) {
    return next();
  }

  // Internal rewrite: /about -> /_sites/yourdomain.com/about
  return rewrite(new URL(`/_sites/${hostname}${path}`, req.url));
}
