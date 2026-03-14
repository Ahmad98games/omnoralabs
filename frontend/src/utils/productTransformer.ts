/**
 * Imperial Hardening: Product Data Transformation Layer
 * Future-proofs the UI against backend schema changes.
 */

export interface IGSGProduct {
    id: string;
    name: string;
    title: string;
    price: number;
    description?: string;
    image?: string;
    images?: string[];
    category?: string;
    product_type?: string;
    stock: number;
    stock_quantity: number;
    variants: any[];
    isNew: boolean;
    isBestseller: boolean;
    showLowStockWarning: boolean;
    metadata?: any;
}

export const transformProduct = (raw: any): IGSGProduct => {
    // Handle Supabase -> UI mapping
    const stock = Number(raw.inventory_count || raw.stock_quantity || raw.stock || 0);
    const price = Number(raw.base_price || raw.price || 0);
    const title = raw.title || raw.name || 'Untitled Product';
    const image = raw.featured_image || raw.image_url || (raw.images && raw.images[0]) || (raw.image) || '/images/placeholder.jpg';

    return {
        id: raw.id || raw._id, 
        name: title,
        title: title,
        price: price,
        description: raw.description || '',
        image: image,
        images: raw.images || (image ? [image] : []),
        category: raw.product_type || raw.category || 'Uncategorized',
        product_type: raw.product_type || raw.category || 'Standard',
        stock: stock,
        stock_quantity: stock,
        variants: raw.variants || [],
        isNew: !!raw.is_new || !!raw.isNew || false,
        isBestseller: !!raw.is_bestseller || !!raw.isBestseller || false,
        showLowStockWarning: raw.showLowStockWarning ?? (stock < 5 && stock > 0),
        metadata: raw.metadata || {}
    };
};

export const transformProductList = (list: any[]): IGSGProduct[] => {
    if (!Array.isArray(list)) return [];
    return list.map(transformProduct);
};
