export interface JsonLdProductProps {
    title: string;
    description: string;
    imageUrl: string[];
    url: string;
    sku?: string;
    price: number;
    currency: string;
    inStock: boolean;
    storeName: string;
    averageRating?: number;
    reviewCount?: number;
}

export class JsonLdGenerator {
    /**
     * Injects JSON-LD (Schema.org) into the Document Head so Google natively 
     * registers Stars, Price, and Stock Status for Organic Search Results.
     */
    static injectProductSchema(props: JsonLdProductProps) {
        const schemaUrl = "https://schema.org/";
        
        const jsonLd: any = {
            "@context": schemaUrl,
            "@type": "Product",
            "name": props.title,
            "image": props.imageUrl,
            "description": props.description.replace(/<[^>]*>?/gm, '').substring(0, 300),
            "sku": props.sku || 'N/A',
            "brand": {
                "@type": "Brand",
                "name": props.storeName
            },
            "offers": {
                "@type": "Offer",
                "url": props.url,
                "priceCurrency": props.currency || "PKR",
                "price": props.price,
                "availability": props.inStock ? `${schemaUrl}InStock` : `${schemaUrl}OutOfStock`,
                "itemCondition": `${schemaUrl}NewCondition`
            }
        };

        // Inject Aggregate Reviews if they exist (Enables "Stars" on Google)
        if (props.averageRating && props.reviewCount) {
            jsonLd.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": props.averageRating.toString(),
                "reviewCount": props.reviewCount.toString()
            };
        }

        this.attachToHead(jsonLd);
    }

    private static attachToHead(schemaObj: any) {
        // Remove existing standard Product Schema if we re-render
        const existingScript = document.getElementById('omnora-jsonld-product');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'omnora-jsonld-product';
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaObj);
        document.head.appendChild(script);
    }
}
