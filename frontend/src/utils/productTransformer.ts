/**
 * Imperial Hardening: Product Data Transformation Layer
 * Future-proofs the UI against backend schema changes.
 * OSTT Fix: Replaced 'any' with strictly mapped Data Transfer Objects (DTOs).
 */

// ─── Utility Types ────────────────────────────────────────────────────────────
type JSONValue = string | number | boolean | null | undefined | { [key: string]: JSONValue } | JSONValue[];

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface IOmnoraEntity {
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
    variants: Record<string, JSONValue>[]; // FIX: Removed any[]
    isNew: boolean;
    isBestseller: boolean;
    showLowStockWarning: boolean;
    metadata?: Record<string, JSONValue>; // FIX: Removed any
}

/**
 * Interface mapping the expected raw payload from various backend schemas
 * (Supabase, MongoDB, etc.) so we don't have to rely on 'any'.
 */
export interface IRawProduct {
    id?: string;
    _id?: string;
    inventory_count?: string | number;
    stock_quantity?: string | number;
    stock?: string | number;
    base_price?: string | number;
    price?: string | number;
    title?: string;
    name?: string;
    featured_image?: string;
    image_url?: string;
    image?: string;
    images?: string[];
    description?: string;
    product_type?: string;
    category?: string;
    variants?: Record<string, JSONValue>[];
    is_new?: boolean;
    isNew?: boolean;
    is_bestseller?: boolean;
    isBestseller?: boolean;
    showLowStockWarning?: boolean;
    metadata?: Record<string, JSONValue>;
    [key: string]: unknown; // Safe catch-all for unexpected DB fields
}

// ─── Transformer Logic ────────────────────────────────────────────────────────

// FIX: Parameter is now explicitly typed as IRawProduct instead of any
export const transformProduct = (raw: IRawProduct): IOmnoraEntity => {
    // Handle Supabase -> UI mapping safely
    const stock = Number(raw.inventory_count || raw.stock_quantity || raw.stock || 0);
    const price = Number(raw.base_price || raw.price || 0);
    const title = raw.title || raw.name || 'Untitled Product';
    
    // Safely handle array access for images
    const firstImage = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : undefined;
    const image = raw.featured_image || raw.image_url || firstImage || raw.image || '/images/placeholder.jpg';

    return {
        id: String(raw.id || raw._id || ''), 
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

// FIX: List parameter is now typed as IRawProduct[] instead of any[]
export const transformProductList = (list: IRawProduct[]): IOmnoraEntity[] => {
    if (!Array.isArray(list)) return [];
    return list.map(transformProduct);
};