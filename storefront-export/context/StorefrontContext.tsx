/**
 * StorefrontContext v2: The Global E-commerce Data Layer
 * 
 * Phase 3 Upgrade: Variant Selection State Machine.
 * 
 * Supplies reactive e-commerce data (Product, Collection, StoreSettings)
 * to any node in the rendering tree. Designed for Shopify OS 2.0 parity.
 * 
 * RULE: This context is STRICTLY for e-commerce data.
 * Do NOT add UI state (sidebar toggles, modals, etc.) here.
 */
import React, { createContext, useContext, useCallback, useMemo, useSyncExternalStore } from 'react';

// ─── Core E-commerce Interfaces ───────────────────────────────────────────────

export interface ProductVariant {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    sku?: string;
    available: boolean;
    options: Record<string, string>; // e.g. { color: 'Black', size: 'M' }
    image?: string;
}

export interface ProductOption {
    name: string;       // e.g. 'Color', 'Size', 'Band'
    values: string[];   // e.g. ['Silver', 'Gold', 'Black']
}

export interface ProductImage {
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

export interface Product {
    id: string;
    title: string;
    handle: string;
    description: string;
    vendor: string;
    type: string;
    tags: string[];
    price: number;
    compareAtPrice?: number;
    currency: string;
    featured_image: string;
    images: ProductImage[];
    options: ProductOption[];       // Phase 3: option definitions
    variants: ProductVariant[];
    available: boolean;
    selectedVariantId?: string;
    metafields?: Record<string, any>;
}

export interface CollectionProduct {
    id: string;
    title: string;
    handle: string;
    price: number;
    compareAtPrice?: number;
    featured_image: string;
    available: boolean;
    vendor: string;
}

export interface Collection {
    id: string;
    title: string;
    handle: string;
    description: string;
    image?: string;
    products: CollectionProduct[];
    /** Full Product objects for grid rendering & scoped binding */
    fullProducts: Product[];
    productsCount: number;
}

export interface StoreSettings {
    name: string;
    currency: string;
    currencySymbol: string;
    locale: string;
    moneyFormat: string;
}

export interface StorefrontState {
    merchantId: string;
    product: Product | null;
    collection: Collection | null;
    settings: StoreSettings;
    selectedVariant: ProductVariant | null;   // Phase 3: derived from selectedVariantId
}

// ─── Storefront Store (Singleton) ─────────────────────────────────────────────

type StorefrontListener = () => void;

class StorefrontStore {
    private state: StorefrontState;
    private listeners = new Set<StorefrontListener>();
    private version = 0;

    constructor(initial: StorefrontState) {
        this.state = initial;
    }

    getState(): StorefrontState {
        return this.state;
    }

    getVersion(): number {
        return this.version;
    }

    /** Flat context for BindingResolver — includes selectedVariant for {{product.selectedVariant.price}} */
    getBindingContext(): Record<string, any> {
        const product = this.state.product;
        return {
            product: product ? {
                ...product,
                selectedVariant: this.state.selectedVariant,
            } : null,
            collection: this.state.collection,
            store: this.state.settings,
        };
    }

    setMerchantId(id: string): void {
        this.state = { ...this.state, merchantId: id };
        this.version++;
        this.notify();
    }

    setProduct(product: Product | null): void {
        const selectedVariant = product
            ? product.variants.find(v => v.id === product.selectedVariantId) ?? product.variants[0] ?? null
            : null;
        this.state = { ...this.state, product, selectedVariant };
        this.version++;
        this.notify();
    }

    setCollection(collection: Collection | null): void {
        this.state = { ...this.state, collection };
        this.version++;
        this.notify();
    }

    /** Phase 3: Select a specific variant by ID */
    setSelectedVariant(variantId: string): void {
        const product = this.state.product;
        if (!product) return;

        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) return;

        // Update product.selectedVariantId + product.price for binding reactivity
        const updatedProduct: Product = {
            ...product,
            selectedVariantId: variantId,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
        };

        this.state = {
            ...this.state,
            product: updatedProduct,
            selectedVariant: variant,
        };
        this.version++;
        this.notify();
    }

    /** Phase 3: Select variant by option combination (e.g. { color: 'Gold', band: 'Leather' }) */
    setSelectedVariantByOptions(selectedOptions: Record<string, string>): void {
        const product = this.state.product;
        if (!product) return;

        const match = product.variants.find(v =>
            Object.entries(selectedOptions).every(([key, val]) => v.options[key] === val)
        );

        if (match) {
            this.setSelectedVariant(match.id);
        }
    }

    updateSettings(partial: Partial<StoreSettings>): void {
        this.state = {
            ...this.state,
            settings: { ...this.state.settings, ...partial },
        };
        this.version++;
        this.notify();
    }

    subscribe(listener: StorefrontListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach(fn => fn());
    }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCT: Product = {
    id: 'prod_001',
    title: 'Luxury Chronograph Watch',
    handle: 'luxury-chronograph-watch',
    description: 'A masterfully crafted timepiece with Swiss movement and sapphire crystal.',
    vendor: 'Omnora Atelier',
    type: 'Watch',
    tags: ['luxury', 'watch', 'swiss', 'chronograph'],
    price: 299.00,
    compareAtPrice: 450.00,
    currency: 'USD',
    featured_image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
    images: [
        { id: 'img_1', src: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800', alt: 'Luxury Watch Front' },
        { id: 'img_2', src: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800', alt: 'Luxury Watch Side' },
    ],
    options: [
        { name: 'Color', values: ['Silver', 'Gold', 'Black'] },
        { name: 'Band', values: ['Steel', 'Leather', 'Ceramic'] },
    ],
    variants: [
        { id: 'var_1', title: 'Silver / Steel', price: 299.00, compareAtPrice: 450.00, sku: 'LCW-SLV-STD', available: true, options: { Color: 'Silver', Band: 'Steel' }, image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800' },
        { id: 'var_2', title: 'Gold / Leather', price: 399.00, compareAtPrice: 550.00, sku: 'LCW-GLD-PRM', available: true, options: { Color: 'Gold', Band: 'Leather' }, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800' },
        { id: 'var_3', title: 'Black / Ceramic', price: 499.00, sku: 'LCW-BLK-LTD', available: false, options: { Color: 'Black', Band: 'Ceramic' } },
    ],
    available: true,
    selectedVariantId: 'var_1',
};

const MOCK_PRODUCT_2: Product = {
    id: 'prod_002',
    title: 'Minimalist Dress Watch',
    handle: 'minimalist-dress-watch',
    description: 'Clean lines, refined elegance. The perfect companion for formal occasions.',
    vendor: 'Omnora Atelier',
    type: 'Watch',
    tags: ['minimalist', 'dress', 'elegant'],
    price: 199.00,
    currency: 'USD',
    featured_image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
    images: [
        { id: 'img_1', src: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800', alt: 'Dress Watch' },
    ],
    options: [
        { name: 'Color', values: ['Rose Gold', 'Platinum'] },
    ],
    variants: [
        { id: 'var_rg', title: 'Rose Gold', price: 199.00, sku: 'MDW-RG', available: true, options: { Color: 'Rose Gold' } },
        { id: 'var_pt', title: 'Platinum', price: 249.00, sku: 'MDW-PT', available: true, options: { Color: 'Platinum' } },
    ],
    available: true,
    selectedVariantId: 'var_rg',
};

const MOCK_PRODUCT_3: Product = {
    id: 'prod_003',
    title: 'Divers Automatic',
    handle: 'divers-automatic',
    description: 'Built to withstand depths of 300m. Luminous dial with rotating bezel.',
    vendor: 'Omnora Atelier',
    type: 'Watch',
    tags: ['diver', 'automatic', 'sport'],
    price: 459.00,
    currency: 'USD',
    featured_image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800',
    images: [
        { id: 'img_1', src: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800', alt: 'Divers Watch' },
    ],
    options: [
        { name: 'Size', values: ['40mm', '44mm'] },
    ],
    variants: [
        { id: 'var_40', title: '40mm', price: 459.00, sku: 'DA-40', available: true, options: { Size: '40mm' } },
        { id: 'var_44', title: '44mm', price: 489.00, sku: 'DA-44', available: true, options: { Size: '44mm' } },
    ],
    available: true,
    selectedVariantId: 'var_40',
};

/** Global product catalog for TemplateResolver lookups (mutable — populated by setCatalog) */
export const PRODUCT_CATALOG: Record<string, Product> = {
    'luxury-chronograph-watch': MOCK_PRODUCT,
    'minimalist-dress-watch': MOCK_PRODUCT_2,
    'divers-automatic': MOCK_PRODUCT_3,
};

/**
 * Phase 15: Dynamically replace the product catalog with cloud-fetched products.
 * Keeps the existing reference intact so TemplateResolver imports stay valid.
 */
export function setCatalog(products: Product[]): void {
    // Clear existing entries
    Object.keys(PRODUCT_CATALOG).forEach(k => delete PRODUCT_CATALOG[k]);
    // Populate with new products keyed by handle
    products.forEach(p => { PRODUCT_CATALOG[p.handle] = p; });
}

const MOCK_COLLECTION: Collection = {
    id: 'col_001',
    title: 'Signature Timepieces',
    handle: 'signature-timepieces',
    description: 'Our curated selection of luxury watches for the modern connoisseur.',
    image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800',
    products: [
        { id: 'prod_001', title: 'Luxury Chronograph Watch', handle: 'luxury-chronograph-watch', price: 299, featured_image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400', available: true, vendor: 'Omnora Atelier' },
        { id: 'prod_002', title: 'Minimalist Dress Watch', handle: 'minimalist-dress-watch', price: 199, featured_image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400', available: true, vendor: 'Omnora Atelier' },
        { id: 'prod_003', title: 'Divers Automatic', handle: 'divers-automatic', price: 459, featured_image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400', available: true, vendor: 'Omnora Atelier' },
    ],
    fullProducts: [MOCK_PRODUCT, MOCK_PRODUCT_2, MOCK_PRODUCT_3],
    productsCount: 3,
};

const MOCK_COLLECTION_2: Collection = {
    id: 'col_002',
    title: 'Sport & Dive',
    handle: 'sport-dive',
    description: 'Engineered for adventure. Built to last.',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800',
    products: [
        { id: 'prod_003', title: 'Divers Automatic', handle: 'divers-automatic', price: 459, featured_image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400', available: true, vendor: 'Omnora Atelier' },
    ],
    fullProducts: [MOCK_PRODUCT_3],
    productsCount: 1,
};

/** Global collection catalog for TemplateResolver lookups */
export const COLLECTION_CATALOG: Record<string, Collection> = {
    'signature-timepieces': MOCK_COLLECTION,
    'sport-dive': MOCK_COLLECTION_2,
};

/** Phase 15: Dynamically replace the collection catalog. */
export function setCollectionCatalog(collections: Collection[]): void {
    Object.keys(COLLECTION_CATALOG).forEach(k => delete COLLECTION_CATALOG[k]);
    collections.forEach(c => { COLLECTION_CATALOG[c.handle] = c; });
}

const DEFAULT_SETTINGS: StoreSettings = {
    name: 'Omnora Store',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    moneyFormat: '${{amount}}',
};

// ─── Singleton Instance ───────────────────────────────────────────────────────

const initialVariant = MOCK_PRODUCT.variants.find(v => v.id === MOCK_PRODUCT.selectedVariantId) ?? MOCK_PRODUCT.variants[0] ?? null;

export const storefrontStore = new StorefrontStore({
    merchantId: 'default_merchant',
    product: MOCK_PRODUCT,
    collection: MOCK_COLLECTION,
    settings: DEFAULT_SETTINGS,
    selectedVariant: initialVariant,
});

// ─── React Context & Hooks ────────────────────────────────────────────────────

interface StorefrontContextValue {
    state: StorefrontState;
    bindingContext: Record<string, any>;
    version: number;
    setMerchantId: (id: string) => void;
    setProduct: (product: Product | null) => void;
    setCollection: (collection: Collection | null) => void;
    setSelectedVariant: (variantId: string) => void;
    setSelectedVariantByOptions: (options: Record<string, string>) => void;
    updateSettings: (partial: Partial<StoreSettings>) => void;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

/**
 * StorefrontProvider: Wraps children with StorefrontContext.
 *
 * Phase 4: Supports `scopedProduct` prop for ProductCard Micro-Context.
 * When scopedProduct is set, the binding context uses that product
 * instead of the global store product. This lets {{product.title}}
 * resolve to the looped product inside a ProductGrid.
 */
export const StorefrontProvider: React.FC<{
    children: React.ReactNode;
    scopedProduct?: Product;
}> = ({ children, scopedProduct }) => {
    const state = useSyncExternalStore(
        useCallback((cb: () => void) => storefrontStore.subscribe(cb), []),
        () => storefrontStore.getState(),
    );

    const version = useSyncExternalStore(
        useCallback((cb: () => void) => storefrontStore.subscribe(cb), []),
        () => storefrontStore.getVersion(),
    );

    const bindingContext = useMemo(() => {
        const base = storefrontStore.getBindingContext();
        if (scopedProduct) {
            // Micro-Context: override product in binding context
            const scopedVariant = scopedProduct.variants.find(
                v => v.id === scopedProduct.selectedVariantId
            ) ?? scopedProduct.variants[0] ?? null;
            return {
                ...base,
                product: { ...scopedProduct, selectedVariant: scopedVariant },
            };
        }
        return base;
    }, [version, scopedProduct]);

    const effectiveState = useMemo<StorefrontState>(() => {
        if (scopedProduct) {
            const scopedVariant = scopedProduct.variants.find(
                v => v.id === scopedProduct.selectedVariantId
            ) ?? scopedProduct.variants[0] ?? null;
            return {
                ...state,
                product: scopedProduct,
                selectedVariant: scopedVariant,
            };
        }
        return state;
    }, [state, scopedProduct]);

    const value = useMemo<StorefrontContextValue>(() => ({
        state: effectiveState,
        bindingContext,
        version,
        setMerchantId: (id) => storefrontStore.setMerchantId(id),
        setProduct: (p) => storefrontStore.setProduct(p),
        setCollection: (c) => storefrontStore.setCollection(c),
        setSelectedVariant: (id) => storefrontStore.setSelectedVariant(id),
        setSelectedVariantByOptions: (opts) => storefrontStore.setSelectedVariantByOptions(opts),
        updateSettings: (s) => storefrontStore.updateSettings(s),
    }), [effectiveState, bindingContext, version]);

    return (
        <StorefrontContext.Provider value={value}>
            {children}
        </StorefrontContext.Provider>
    );
};

export function useStorefront(): StorefrontContextValue {
    const ctx = useContext(StorefrontContext);
    if (!ctx) {
        return {
            state: storefrontStore.getState(),
            bindingContext: storefrontStore.getBindingContext(),
            version: storefrontStore.getVersion(),
            setMerchantId: (id) => storefrontStore.setMerchantId(id),
            setProduct: (p) => storefrontStore.setProduct(p),
            setCollection: (c) => storefrontStore.setCollection(c),
            setSelectedVariant: (id) => storefrontStore.setSelectedVariant(id),
            setSelectedVariantByOptions: (opts) => storefrontStore.setSelectedVariantByOptions(opts),
            updateSettings: (s) => storefrontStore.updateSettings(s),
        };
    }
    return ctx;
}

export function useStorefrontBinding(): { bindingContext: Record<string, any>; version: number } {
    const ctx = useContext(StorefrontContext);
    if (!ctx) {
        return {
            bindingContext: storefrontStore.getBindingContext(),
            version: storefrontStore.getVersion(),
        };
    }
    return { bindingContext: ctx.bindingContext, version: ctx.version };
}
