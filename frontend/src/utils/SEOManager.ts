/**
 * SEOManager: Metadata Formatting Helper
 * 
 * Formats Title, Description, and absolute OG-Image URLs for Next.js
 * generateMetadata() pipelines flawlessly.
 */

export interface SEOMetadata {
    title?: string;
    description?: string;
    og_image_url?: string;
    slug?: string;
    merchant_name?: string;
}

export function formatMetadata(data: SEOMetadata) {
    const siteName = data.merchant_name || 'Omnora Store';
    const fallbackTitle = data.title || 'Welcome';
    const baseTitle = `${fallbackTitle} | ${siteName}`;

    const description = data.description || `Shop the latest at ${siteName}. Powered by Omnora OS.`;
    
    // Ensure absolute OG Image URL
    let ogImage = data.og_image_url || 'https://omnora.com/default-og.png';
    if (ogImage.startsWith('/')) {
        const host = typeof window !== 'undefined' ? window.location.origin : 'https://omnora.com';
        ogImage = `${host}${ogImage}`;
    }

    return {
        title: baseTitle,
        description: description,
        openGraph: {
            title: baseTitle,
            description: description,
            images: [{ url: ogImage, width: 1200, height: 630 }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: baseTitle,
            description: description,
            images: [ogImage],
        },
    };
}
