import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useStorefront } from '../../hooks/useStorefront';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
    storeName?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    type?: 'website' | 'product';
    productData?: Record<string, unknown>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ 
    storeName, 
    description, 
    ogImage, 
    canonical, 
    type = 'website',
    productData 
}) => {
    const { content } = useStorefront();
    const location = useLocation();

    // ─── Liquid Hydration Engine ──────────────────────────────────────────────
    // Parses placeholders like {{product.title}} from merchant-defined strings
    const hydrate = useCallback((text: string) => {
        if (!text) return '';
        let hydrated = text;
        
        if (productData) {
            Object.keys(productData).forEach(key => {
                const val = productData[key];
                if (typeof val === 'string') {
                    hydrated = hydrated.replace(new RegExp(`{{product.${key}}}`, 'g'), val);
                }
            });
        }

        if (content?.configuration) {
            hydrated = hydrated.replace(/\{\{store\.name\}\}/g, content.configuration.name || '');
        }

        return hydrated;
    }, [content, productData]);

    const finalTitle = useMemo(() => {
        const base = storeName || content?.configuration?.name || 'Omnora Store';
        return hydrate(base);
    }, [storeName, content, hydrate]);

    const finalDesc = useMemo(() => {
        return hydrate(description || content?.configuration?.description || 'Luxury E-commerce powered by Omnora OS.');
    }, [description, content, hydrate]);

    const finalOGImage = ogImage || content?.configuration?.assets?.logo || '/images/omnora.jpg';
    const finalCanonical = canonical || `${window.location.origin}${location.pathname}`;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDesc} />
            <link rel="canonical" href={finalCanonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={finalCanonical} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDesc} />
            <meta property="og:image" content={finalOGImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={finalCanonical} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={finalDesc} />
            <meta property="twitter:image" content={finalOGImage} />

            {/* Dynamic Favicon (if set in CMS) */}
            {content?.configuration?.assets?.favicon && (
                <link rel="icon" type="image/x-icon" href={content.configuration.assets.favicon} />
            )}
        </Helmet>
    );
};

export default SEOHead;
