import { Suspense, cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RobustRenderer } from '../../../../platform/publish/RobustRenderer';

// OSTT FIX: Updated the formatMetadata structure so we don't rely on external file if not found
const formatMetadata = (data: { title: string; description: string; og_image_url: string; merchant_name: string; slug: string }) => {
    return {
        title: data.title,
        description: data.description,
        openGraph: {
            images: [data.og_image_url],
            title: data.title,
            description: data.description
        }
    };
};

// ─── Industrial Interfaces ───────────────────────────────────────────────────
interface OmnoraBlock {
    id?: string;
    type: string;
    props?: Record<string, unknown>;
}

// OSTT FIX: Included schemaVersion in PlatformBlock interface to satisfy renderer
interface PlatformBlock {
    id: string;
    type: string;
    parentId: string | null;
    children: string[];
    props: Record<string, unknown>;
    styles: Record<string, string>;
    schemaVersion: number;
}

interface PageData {
    ast_manifest: OmnoraBlock[];
    theme_vars: Record<string, string>;
    title: string;
    seo_title: string | null;
    seo_description: string | null;
    og_image_url: string | null;
    merchants: {
        slug: string;
        name: string;
    };
}

interface PageProps {
    params: { merchant_slug: string; page_slug: string };
}

export const revalidate = 60; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuywxaeancehgibiibne.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── Data Fetching with React cache() ─────────────────────────────────────────
const getPageData = cache(async (merchant: string, page: string): Promise<PageData | null> => {
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
    return data as unknown as PageData; 
});

// ─── Metadata Generation ──────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps) {
    const data = await getPageData(params.merchant_slug, params.page_slug);
    if (!data) return { title: 'Store Not Found' };

    return formatMetadata({
        title: data.seo_title || data.title,
        description: data.seo_description || '',
        og_image_url: data.og_image_url || '',
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

    // OSTT FIX: Strictly implemented PlatformBlock to fix compatibility with RobustRenderer
    const nodes: Record<string, PlatformBlock> = {};
    
    const layout: string[] = [];
    const manifest = Array.isArray(data.ast_manifest) ? data.ast_manifest : [];

    manifest.forEach((block: OmnoraBlock, index: number) => {
        const id = block.id || `node_${block.type.toLowerCase()}_${index}`;
        nodes[id] = {
            id,
            type: block.type,
            parentId: null,
            children: [],
            props: block.props || {},
            styles: {},
            schemaVersion: 2, // Included required property
        };
        layout.push(id);
    });

    const cssVars = Object.entries(data.theme_vars || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(';');
    const criticalStyle = `:root { ${cssVars} }`;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: criticalStyle }} />
            <Suspense fallback={<OmnoraLoading />}>
                <div style={{ width: '100%', minHeight: '100vh' }}>
                    <RobustRenderer nodes={nodes} rootIds={layout} />
                </div>
            </Suspense>
        </>
    );
}