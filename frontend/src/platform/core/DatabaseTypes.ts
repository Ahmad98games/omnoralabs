import type { Product } from '../../context/StorefrontContext';
import type { PlatformBlock } from '../core/types';
import type { ThemeConfig } from '../../components/cms/ThemeManager';
import type { SymbolBlueprint } from '../core/SymbolManager';

export interface StorefrontConfig {
    /** Unique build ID for cache invalidation */
    buildId: string;
    /** ISO timestamp of compilation */
    publishedAt: string;
    /** Schema version for future migration */
    schemaVersion: number;

    /** All nodes in the builder, fully resolved */
    nodes: Record<string, PlatformBlock>;
    /** Page layout definitions: which root node IDs compose each page template */
    pageLayouts: Record<string, string[]>;

    /** Global theme tokens */
    theme: ThemeConfig;

    /** Resolved symbol blueprints (for reference/debugging) */
    symbols: SymbolBlueprint[];

    /** The owner of this store */
    merchantId: string;
    /** SEO metadata per page */
    seo?: Record<string, { title?: string; description?: string }>;
}

export interface MerchantUser {
    id: string;
    email: string;
    displayName: string;
    storeName: string;
    storeSlug: string;
    plan: 'free' | 'pro' | 'enterprise';
    paymentSettings?: {
        stripePublicKey: string;
        hasStripeConfigured: boolean;
        hasWebhookConfigured: boolean;
    };
    createdAt: string;
}

export interface StoreConfigRecord {
    id: string;
    merchantId: string;
    config: StorefrontConfig;
    domain: string;
    isLive: boolean;
    isSuspended?: boolean;
    updatedAt: string;
}

export interface CheckoutSession {
    sessionId: string;
    orderId: string;
    checkoutUrl: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'expired';
}

export interface CustomPage {
    id: string;
    merchantId: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    nodeIds: string[];
    createdAt: string;
    updatedAt: string;
    lastUpdated?: any;
    seoMeta?: {
        title?: string;
        description?: string;
        ogImage?: string;
    };
    type?: 'system' | 'template' | 'custom';
    isLocked?: boolean;
}

export interface NavLink {
    id: string;
    label: string;
    url: string;
    type?: 'internal' | 'external';
}

export interface NavMenu {
    id: string;
    merchantId: string;
    name: string;
    links: NavLink[];
    updatedAt: string;
}

export interface DiscountCode {
    id: string;
    merchantId: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    isActive: boolean;
    usageLimit?: number;
    usageCount: number;
    createdAt: string;
}

export interface Order {
    id: string;
    merchantId: string;
    customerEmail: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    createdAt: string;
    currency: string;
}

export interface StoreAnalytics {
    totalRevenue: number;
    orderCount: number;
    views: number;
    conversionRate: number;
    averageOrderValue: number;
    recentOrders: Order[];
    dailyStats: DailyStat[];
}

export interface IDatabaseClient {
    // Auth
    signUp(email: string, password: string, displayName: string): Promise<MerchantUser>;
    signIn(email: string, password: string): Promise<MerchantUser>;
    signOut(): Promise<void>;
    getCurrentUser(): Promise<MerchantUser | null>;

    // Merchant Settings
    updateMerchantPaymentSettings(updates: { stripePublicKey?: string; stripeSecretKey?: string; stripeWebhookSecret?: string; }): Promise<void>;
    getMerchantPaymentSettings(merchantId: string): Promise<any>;

    // Store Configs
    saveStoreConfig(merchantId: string, config: StorefrontConfig, domain: string): Promise<StoreConfigRecord>;
    getStoreConfigByMerchant(merchantId: string): Promise<StoreConfigRecord | null>;
    getStoreConfigByDomain(domain: string): Promise<StoreConfigRecord | null>;

    // Orders
    createOrder(merchantId: string, customer: any, items: any[], subtotal: number, currency: string): Promise<Order>;
    getOrders(merchantId: string): Promise<Order[]>;
    getStoreAnalytics(merchantId: string): Promise<StoreAnalytics>;
    trackInteraction(merchantId: string, event: {
        eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'purchase';
        productId?: string;
        sessionId?: string;
        metadata?: any;
    }): Promise<void>;
    updateOrderStatus(orderId: string, status: Order['status']): Promise<void>;

    // Payments
    createCheckoutSession(orderId: string, amount: number, currency: string): Promise<CheckoutSession>;

    // Products
    getProductsByMerchant(merchantId: string): Promise<Product[]>;
    createProduct(merchantId: string, product: Omit<Product, 'id'>): Promise<Product>;
    updateProduct(productId: string, updates: Partial<Product>): Promise<Product>;
    deleteProduct(merchantId: string, productId: string): Promise<void>;
    getProductById(productId: string): Promise<Product | null>;

    // Categories
    getCategories(merchantId: string): Promise<Category[]>;
    upsertCategory(merchantId: string, category: any): Promise<Category>;
    deleteCategory(merchantId: string, categoryId: string): Promise<void>;

    // Pages
    getPagesByMerchant(merchantId: string): Promise<CustomPage[]>;
    createPage(merchantId: string, page: Omit<CustomPage, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>): Promise<CustomPage>;
    updatePage(pageId: string, updates: Partial<CustomPage>): Promise<CustomPage>;
    deletePage(merchantId: string, pageId: string): Promise<void>;

    // Navigation
    saveNavMenu(merchantId: string, name: string, links: NavLink[]): Promise<NavMenu>;
    getNavMenu(merchantId: string, name: string): Promise<NavMenu | null>;

    // Discounts
    createDiscount(merchantId: string, discount: Omit<DiscountCode, 'id' | 'merchantId' | 'usageCount' | 'createdAt'>): Promise<DiscountCode>;
    getDiscountsByMerchant(merchantId: string): Promise<DiscountCode[]>;
    updateDiscount(discountId: string, updates: Partial<DiscountCode>): Promise<DiscountCode>;
    deleteDiscount(merchantId: string, discountId: string): Promise<void>;
    validateDiscountCode(code: string, merchantId: string): Promise<DiscountCode | null>;
}

export interface Category {
    id: string;
    merchantId: string;
    name: string;
    description?: string;
    slug: string;
    image?: string;
    parentId?: string;
    createdAt?: string;
}

export interface DailyStat {
    date: string;
    revenue: number;
    views: number;
    orders: number;
    createdAt?: string;
}
