import { useCallback, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';

export function useStorefront() {
    const { storeSlug } = useParams<{ storeSlug?: string }>();
    const location = useLocation();
    const { updateSellerStyles } = useTheme();

    const isPreview = new URLSearchParams(location.search).get('preview') === 'true';

    // ─── Phase 49: TanStack Query Integration ────────────────────────────────
    // This replaces manual useEffect/useState with a hardened caching layer.
    const { 
        data: contentResponse, 
        isLoading, 
        isFetching,
        error: queryError,
        refetch 
    } = useQuery({
        queryKey: ['storefront', storeSlug, isPreview],
        queryFn: async () => {
            const endpoint = storeSlug ? `/cms/content?slug=${storeSlug}` : '/cms/content';
            const { data } = await client.get(`${endpoint}${endpoint.includes('?') ? '&' : '?'}preview=${isPreview}`);
            return data;
        },
        staleTime: 60 * 1000, // 1 minute: serve from RAM, revalidate in background
        gcTime: 5 * 60 * 1000, // 5 minutes: keep in memory
    });

    const content = contentResponse?.content || null;

    // Optional: Fetch stats only if not in preview (cached separately)
    const { data: statsResponse } = useQuery({
        queryKey: ['performance-hub'],
        queryFn: async () => {
            const { data } = await client.get('/cms/performance-hub');
            return data;
        },
        enabled: !isPreview && !!content,
        staleTime: 5 * 60 * 1000, 
    });

    // Handle side effects whenever content changes (served from cache OR network)
    useEffect(() => {
        if (!content) return;

        // 1. Inject Tenant Styles
        if (content.configuration?.colors) {
            updateSellerStyles(content.configuration.colors);
        } else if (content.globalStyles) {
            updateSellerStyles(content.globalStyles);
        }

        // 2. Inject Identity (Title/Favicon)
        const storeName = content.configuration?.name || (storeSlug ? storeSlug.toUpperCase() : 'OMNORA');
        document.title = isPreview ? `[PREVIEW] ${storeName} | Dashboard` : `${storeName} | Luxury Storefront`;

        if (content.configuration?.assets?.favicon) {
            const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = content.configuration.assets.favicon;
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }, [content, isPreview, storeSlug, updateSellerStyles]);

    return {
        content,
        stats: statsResponse?.stats || null,
        loading: isLoading, // Initial load
        isFetching, // Background revalidation
        error: queryError ? (queryError as any).message : null,
        isPreview,
        storeSlug,
        refresh: refetch
    };
}
