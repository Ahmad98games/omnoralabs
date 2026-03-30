'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { CleanRenderer } from '../../../platform/publish/CleanRenderer';

interface PageProps {
    params: { slug: string };
}

// OSTT FIX: Replaced 'any' with explicit strict typing for page data
interface PageData {
    nodes: Record<string, Record<string, unknown>>;
    layout: string[];
    theme_vars: React.CSSProperties;
}

interface ASTBlock {
    type: string;
    props?: Record<string, unknown>;
}

export default function StorePage({ params }: PageProps) {
    // OSTT FIX: Applied PageData interface
    const [pageData, setPageData] = useState<PageData | null>(null);
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
                // OSTT FIX: Removed 'any' from nodes
                const nodes: Record<string, Record<string, unknown>> = {};
                const layout: string[] = [];
                
                if (data.ast_manifest && Array.isArray(data.ast_manifest)) {
                    data.ast_manifest.forEach((block: ASTBlock, index: number) => {
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
            // OSTT FIX: Removed catch (err: any) and replaced with instanceof check
            } catch (err) {
                console.error("[StorePage fetch error]", err);
                setError(err instanceof Error ? err.message : "Failed to load store.");
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