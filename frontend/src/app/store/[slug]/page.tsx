'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { CleanRenderer } from '../../../platform/publish/CleanRenderer';

interface PageProps {
    params: { slug: string };
}

export default function StorePage({ params }: PageProps) {
    const [pageData, setPageData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStorePage = async () => {
            try {
                const { data, error: dbError } = await supabase
                    .from('store_pages')
                    .select('*')
                    .eq('slug', params.slug)
                    .eq('is_published', true)
                    .single();

                if (dbError) throw dbError;
                if (!data) throw new Error("Store page not found or not published.");

                // Convert ast_manifest (array) back to CleanRenderer structure (nodes map)
                const nodes: Record<string, any> = {};
                const layout: string[] = [];
                
                if (data.ast_manifest && Array.isArray(data.ast_manifest)) {
                    data.ast_manifest.forEach((block: any, index: number) => {
                        const id = `node_${block.type.toLowerCase()}_${Date.now()}_${index}`;
                        nodes[id] = {
                            id,
                            type: block.type,
                            parentId: null,
                            children: [],
                            props: block.props || {},
                            styles: {},
                            schemaVersion: 2,
                            revision: 1
                        };
                        layout.push(id);
                    });
                }

                setPageData({
                    nodes,
                    layout,
                    theme_vars: data.theme_vars || {}
                });
            } catch (err: any) {
                console.error("[StorePage fetch error]", err);
                setError(err.message || "Failed to load store.");
            } finally {
                setLoading(false);
            }
        };

        if (params.slug) {
            fetchStorePage();
        }
    }, [params.slug]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#fff' }}>
                Loading Storefront...
            </div>
        );
    }

    if (error || !pageData) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#ef4444' }}>
                {error || "Store not found."}
            </div>
        );
    }

    return (
        <div style={pageData.theme_vars}>
            <CleanRenderer nodes={pageData.nodes} rootIds={pageData.layout} />
        </div>
    );
}
