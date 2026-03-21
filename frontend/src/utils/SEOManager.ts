import { getDynamicOgUrl } from './OgImageGenerator';

export interface SeoProps {
    title: string;
    description: string;
    storeName: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    url: string;
}

export class SeoManager {
    /**
     * Injects Dynamic Meta Tags for OpenGraph and Twitter Cards directly into the DOM (for Vite/React apps)
     */
    static injectProductTags(props: SeoProps) {
        // [Product Name] - [Price] | [Store Name]
        const fullTitle = props.price 
            ? `${props.title} - ${props.currency || 'PKR'} ${props.price} | ${props.storeName}`
            : `${props.title} | ${props.storeName}`;

        // Auto-extract first 160 characters for SEO Best Practices
        const rawDesc = props.description.replace(/<[^>]*>?/gm, ''); // Strip HTML if it's rich text
        const cleanDesc = rawDesc.length > 160 ? rawDesc.substring(0, 157) + '...' : rawDesc;

        // Determine OG Image - Use specific dynamic generator if we have price, else raw image
        const ogImage = props.imageUrl && props.price
            ? getDynamicOgUrl(props.title, props.price, props.imageUrl, props.currency)
            : props.imageUrl || 'https://omnora.com/default-og.png';

        // 1. Title
        document.title = fullTitle;

        // 2. Standard Meta
        this.setMetaTag('name', 'description', cleanDesc);
        
        // 3. OpenGraph
        this.setMetaTag('property', 'og:title', fullTitle);
        this.setMetaTag('property', 'og:description', cleanDesc);
        this.setMetaTag('property', 'og:url', props.url);
        this.setMetaTag('property', 'og:type', 'product');
        this.setMetaTag('property', 'og:image', ogImage);

        // 4. Twitter Card
        this.setMetaTag('name', 'twitter:card', 'summary_large_image');
        this.setMetaTag('name', 'twitter:title', fullTitle);
        this.setMetaTag('name', 'twitter:description', cleanDesc);
        this.setMetaTag('name', 'twitter:image', ogImage);
    }

    private static setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
        let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attrName, attrValue);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    }
}
