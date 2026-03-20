import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://cuywxaeancehgibiibne.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fSTvAeJdvOl4WkUIPVz65Q_xTTScsF-';

const PLATFORM_DOMAINS = [
  'localhost:3000',
  'omnora.com',
  'omnora.vercel.app',
  'omnora-os.vercel.app',
  '127.0.0.1:3000'
];

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next, static (Next.js internals & sets)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next|_vercel|static|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

export default async function middleware(req: any) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // 1. Skip standard exclusion paths
  if (path.startsWith('/api') || path.startsWith('/assets')) {
    return NextResponse.next();
  }

  // 2. Identify Platform Domain
  const isPlatform = PLATFORM_DOMAINS.some(
    (domain) => hostname === domain || hostname.startsWith(`${domain}`)
  );

  // Parse Subdomain layout
  let subdomain = '';
  if (hostname.endsWith('.omnora.com')) {
    subdomain = hostname.replace('.omnora.com', '');
  }

  // If www or platform domain root without subdomain, continue standard layout
  if (isPlatform || subdomain === 'www') {
    return NextResponse.next();
  }

  let merchantSlug = '';

  try {
    if (subdomain) {
      // Lookup merchant by Subdomain (Slug)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/merchants?slug=eq.${subdomain}&select=slug`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json().catch(() => []);
      if (data && data.length > 0) {
        merchantSlug = data[0].slug;
      }
    } else {
      // Custom Domain Lookup
      const res = await fetch(`${SUPABASE_URL}/rest/v1/merchants?custom_domain=eq.${hostname}&select=slug`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json().catch(() => []);
      if (data && data.length > 0) {
        merchantSlug = data[0].slug;
      }
    }
  } catch (err) {
    console.error('[Middleware Edge Lookup Error]', err);
  }

  if (merchantSlug) {
    // Prevent infinite loop rewriting
    if (path.startsWith(`/store/${merchantSlug}`)) {
      return NextResponse.next();
    }

    // Standard redirect: Root URL loads '/home'
    const targetPath = path === '/' ? '/home' : path;
    const rewriteUrl = new URL(`/store/${merchantSlug}${targetPath}`, req.url);

    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set('X-Omnora-Tenant', merchantSlug);
    return response;
  }

  return NextResponse.next();
}
