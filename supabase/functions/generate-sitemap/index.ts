import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// The function responds dynamically and creates XML
serve(async (req) => {
  // CORS Headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/xml');
  headers.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('<error>Store slug is required</error>', { status: 400, headers });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Merchant ID by Slug
    const { data: store, error: storeError } = await supabase
      .from('merchants')
      .select('id, custom_domain')
      .eq('slug', slug)
      .single();

    if (storeError || !store) {
      return new Response('<error>Store not found</error>', { status: 404, headers });
    }

    const baseUrl = store.custom_domain ? `https://${store.custom_domain}` : `https://omnora.com/s/${slug}`;

    // 2. Fetch Active Products
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('merchant_id', store.id)
      .eq('is_active', true);

    if (productError) throw productError;

    // 3. Construct XML Sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add homepage
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Add product pages
    if (products) {
      for (const product of products) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/p/${product.id}</loc>\n`;
        xml += `    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, { headers, status: 200 });
  } catch (error: any) {
    return new Response(`<error>${error.message}</error>`, { status: 500, headers });
  }
});
