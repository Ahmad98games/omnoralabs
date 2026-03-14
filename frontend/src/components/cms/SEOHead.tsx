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
    productData?: any;
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
    const hydrate = (text: string) => {
        if (!text) return '';
        let hydrated = text;
        
        if (productData) {
            hydrated = hydrated
                .replace(/\{\{product\.title\}\}/g, productData.title || '')
                .replace(/\{\{product\.description\}\}/g, (productData.description || '').substring(0, 160))
                .replace(/\{\{product\.price\}\}/g, String(productData.price || ''))
                .replace(/\{\{product\.type\}\}/g, productData.type || '');
        }

        if (content?.configuration) {
            hydrated = hydrated.replace(/\{\{store\.name\}\}/g, content.configuration.name || '');
        }

        return hydrated;
    };

    const finalTitle = useMemo(() => {
        const base = storeName || content?.configuration?.name || 'Omnora Store';
        return hydrate(base);
    }, [storeName, content, productData]);

    const finalDesc = useMemo(() => {
        return hydrate(description || content?.configuration?.description || 'Luxury E-commerce powered by Omnora OS.');
    }, [description, content, productData]);

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
