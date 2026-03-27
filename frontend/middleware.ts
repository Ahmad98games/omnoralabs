import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fSTvAeJdvOl4WkUIPVz65Q_xTTScsF-';

const PLATFORM_DOMAINS = [
  'localhost:3000',
  'omnora.com',
  'omnora.vercel.app',
  'omnora-os.vercel.app',
  '127.0.0.1:3000'
];

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|static|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 🛡️ CORRECT: Logic for Session Refreshing
  await supabase.auth.getUser();

  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // 1. Skip standard exclusion paths & Public Paths
  const isPublicPath = path.startsWith('/login') || path.startsWith('/auth/callback') || path.endsWith('.webmanifest');
  if (path.startsWith('/api') || path.startsWith('/assets') || isPublicPath) {
    return response;
  }

  // 2. Identify Platform Domain
  const isPlatform = PLATFORM_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  ) || hostname.endsWith('.vercel.app');

  if (isPlatform) {
    return response;
  }

  // 3. Multi-Tenant Rewriting
  let merchantSlug = '';
  try {
    // Lookup by custom domain or subdomain
    const res = await fetch(`${SUPABASE_URL}/rest/v1/merchants?or=(custom_domain.eq.${hostname},slug.eq.${hostname.split('.')[0]})&select=slug`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json().catch(() => []);
    if (data && data.length > 0) {
      merchantSlug = data[0].slug;
    }
  } catch (err) {
    console.error('[Middleware Edge Lookup Error]', err);
  }

  if (merchantSlug) {
    if (path.startsWith(`/store/${merchantSlug}`)) {
      return response;
    }
    const targetPath = path === '/' ? '/home' : path;
    const rewriteUrl = new URL(`/store/${merchantSlug}${targetPath}`, req.url);
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);
    rewriteResponse.headers.set('X-Omnora-Tenant', merchantSlug);
    return rewriteResponse;
  }

  return response;
}
