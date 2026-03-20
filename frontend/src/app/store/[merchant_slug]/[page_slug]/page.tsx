import { Suspense, cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RobustRenderer } from '../../../../platform/publish/RobustRenderer';
import { formatMetadata } from '../../../../utils/SEOManager';

interface PageProps {
    params: { merchant_slug: string; page_slug: string };
}

export const revalidate = 60; // SWR (Stale-While-Revalidate) Cache 60 seconds

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_fSTvAeJdvOl4WkUIPVz65Q_xTTScsF-'; // Anon/Fallback for safely

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── Data Fetching with React cache() ─────────────────────────────────────────
const getPageData = cache(async (merchant: string, page: string) => {
    const { data, error } = await supabaseAdmin
        .from('store_pages')
        .select(`
            ast_manifest, 
            theme_vars, 
            title, 
            seo_title, 
            seo_description, 
            og_image_url,
            merchants!inner(slug, name)
        `)
        .eq('slug', page)
        .eq('merchants.slug', merchant)
        .eq('is_published', true)
        .single();

    if (error || !data) return null;
    return data;
});

// ─── Metadata Generation ──────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps) {
    const data = await getPageData(params.merchant_slug, params.page_slug);
    if (!data) return { title: 'Store Not Found' };

    return formatMetadata({
        title: data.seo_title || data.title,
        description: data.seo_description,
        og_image_url: data.og_image_url,
        merchant_name: data.merchants.name,
        slug: params.page_slug,
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

const OmnoraLoading = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#fff', fontSize: '14px' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '12px' }} />
        Loading Omnora Storefront...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

export default async function StorePage({ params }: PageProps) {
    const data = await getPageData(params.merchant_slug, params.page_slug);

    if (!data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#fff' }}>
                404 | Store Page Not Found
            </div>
        );
    }

    // Pre-process nodes conversion from ast_manifest array to Record map
    const nodes: Record<string, any> = {};
    const layout: string[] = [];
    const manifest = Array.isArray(data.ast_manifest) ? data.ast_manifest : [];

    manifest.forEach((block: any, index: number) => {
        const id = `node_${block.type.toLowerCase()}_${Date.now()}_${index}`;
        nodes[id] = {
            id,
            type: block.type,
            parentId: null,
            children: [],
            props: block.props || {},
            styles: {},
        };
        layout.push(id);
    });

    // ─── Critical CSS path (FOUC prevent) ────────────────────────────────────
    const cssVars = Object.entries(data.theme_vars || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(';');
    const criticalStyle = `:root { ${cssVars} }`;

    return (
        <>
            {/* Inline Critical CSS eliminates theme variables Flash of unstyled Content */}
            <style dangerouslySetInnerHTML={{ __html: criticalStyle }} />
            
            <Suspense fallback={<OmnoraLoading />}>
                <div style={{ width: '100%', minHeight: '100vh' }}>
                    <RobustRenderer nodes={nodes} rootIds={layout} />
                </div>
            </Suspense>
        </>
    );
}
