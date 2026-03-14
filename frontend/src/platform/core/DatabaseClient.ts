/**
 * DatabaseClient: Cloud Adapter Pattern
 *
 * Provides a clean interface for all cloud persistence operations.
 * The concrete implementation can be swapped between:
 *   - MockDatabaseClient (localStorage, for development)
 *   - SupabaseDatabaseClient (real cloud, for production)
 *   - FirebaseDatabaseClient (alternative)
 *
 * Three core collections: Users, StoreConfigs, Orders.
 */

import type { StorefrontConfig } from './DatabaseTypes';
import type { OrderCustomer, OrderLineItem } from './OrderStore';
import type { Product } from '../../context/StorefrontContext';
import { supabase } from '../../lib/supabaseClient';
import { SupabaseDatabaseClient } from './SupabaseDatabaseClient';

import type {
    MerchantUser,
    StoreConfigRecord,
    Order,
    DailyStat,
    StoreAnalytics,
    CheckoutSession,
    CustomPage,
    NavLink,
    NavMenu,
    DiscountCode,
    Category,
    IDatabaseClient
} from './DatabaseTypes';

// ─── Mock Implementation (localStorage) ───────────────────────────────────────

const MOCK_USERS_KEY = 'omnora_cloud_users';
const MOCK_CONFIGS_KEY = 'omnora_cloud_configs';

class MockDatabaseClient implements IDatabaseClient {
    private currentUser: MerchantUser | null = null;

    // ── Auth ──────────────────────────────────────────────────────────────

    async signUp(email: string, _password: string, displayName: string): Promise<MerchantUser> {
        await this.simulateLatency();
        const user: MerchantUser = {
            id: `usr_${Date.now()}`,
            email,
            displayName,
            storeName: `${displayName}'s Store`,
            storeSlug: displayName.toLowerCase().replace(/\s+/g, '-'),
            plan: 'free',
            createdAt: new Date().toISOString(),
        };
        const users = this.loadUsers();
        if (users.find(u => u.email === email)) {
            throw new Error('A user with this email already exists.');
        }
        users.push(user);
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
        this.currentUser = user;
        localStorage.setItem('omnora_current_user', JSON.stringify(user));
        return user;
    }

    async signIn(email: string, _password: string): Promise<MerchantUser> {
        await this.simulateLatency();
        const users = this.loadUsers();
        const user = users.find(u => u.email === email);
        if (!user) throw new Error('Invalid credentials.');
        this.currentUser = user;
        localStorage.setItem('omnora_current_user', JSON.stringify(user));
        return user;
    }

    async signOut(): Promise<void> {
        this.currentUser = null;
        localStorage.removeItem('omnora_current_user');
    }

    async getCurrentUser(): Promise<MerchantUser | null> {
        if (this.currentUser) return this.currentUser;
        try {
            const raw = localStorage.getItem('omnora_current_user');
            if (raw) {
                this.currentUser = JSON.parse(raw);
                return this.currentUser;
            }
        } catch { /* ignore */ }
        return null;
    }

    // ── Payment Settings ──────────────────────────────────────────────────

    async updateMerchantPaymentSettings(updates: { stripePublicKey?: string; stripeSecretKey?: string; stripeWebhookSecret?: string; }): Promise<void> {
        await this.simulateLatency();
        if (this.currentUser) {
            this.currentUser.paymentSettings = {
                stripePublicKey: updates.stripePublicKey || this.currentUser.paymentSettings?.stripePublicKey || '',
                hasStripeConfigured: !!(updates.stripeSecretKey || this.currentUser.paymentSettings?.hasStripeConfigured),
                hasWebhookConfigured: !!(updates.stripeWebhookSecret || this.currentUser.paymentSettings?.hasWebhookConfigured)
            };
            localStorage.setItem('omnora_current_user', JSON.stringify(this.currentUser));
            const users = this.loadUsers();
            const idx = users.findIndex(u => u.id === this.currentUser!.id);
            if (idx >= 0) {
                users[idx] = this.currentUser;
                localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
            }
        }
    }

    // ── Store Configs ─────────────────────────────────────────────────────

    async saveStoreConfig(merchantId: string, config: StorefrontConfig, domain: string): Promise<StoreConfigRecord> {
        await this.simulateLatency();
        const configs = this.loadConfigs();
        const existing = configs.findIndex(c => c.merchantId === merchantId);
        const record: StoreConfigRecord = {
            id: existing >= 0 ? configs[existing].id : `cfg_${Date.now()}`,
            merchantId,
            config,
            domain,
            isLive: true,
            updatedAt: new Date().toISOString(),
        };
        if (existing >= 0) {
            configs[existing] = record;
        } else {
            configs.push(record);
        }
        localStorage.setItem(MOCK_CONFIGS_KEY, JSON.stringify(configs));
        return record;
    }

    async getStoreConfigByMerchant(merchantId: string): Promise<StoreConfigRecord | null> {
        await this.simulateLatency();
        const configs = this.loadConfigs();
        return configs.find(c => c.merchantId === merchantId) || null;
    }

    async getStoreConfigByDomain(domain: string): Promise<StoreConfigRecord | null> {
        await this.simulateLatency();
        const configs = this.loadConfigs();
        return configs.find(c => c.domain === domain) || null;
    }

    // ── Orders ────────────────────────────────────────────────────────────

    async createOrder(merchantId: string, customer: any, items: any[], subtotal: number, currency: string): Promise<Order> {
        await this.simulateLatency();
        const order: Order = {
            id: `OMN-${Date.now() % 100000}`,
            merchantId,
            customerEmail: customer.email,
            customerName: customer.name,
            items,
            totalAmount: subtotal, // simplified for mock
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            currency,
        };
        // Also save to local OrderStore for admin panel reactivity
        const key = `omnora_cloud_orders_${merchantId}`;
        const orders = JSON.parse(localStorage.getItem(key) || '[]');
        orders.push(order);
        localStorage.setItem(key, JSON.stringify(orders));
        return order;
    }

    async getOrders(merchantId: string): Promise<Order[]> {
        await this.simulateLatency();
        const key = `omnora_cloud_orders_${merchantId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
        await this.simulateLatency();
        // In production this would be a proper DB update
        console.log(`[MockDB] Order ${orderId} status → ${status}`);
        
        // Update local storage if needed
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith('omnora_cloud_orders_')) continue;
            const orders: Order[] = JSON.parse(localStorage.getItem(k) || '[]');
            const idx = orders.findIndex(o => o.id === orderId);
            if (idx >= 0) {
                orders[idx].status = status;
                localStorage.setItem(k, JSON.stringify(orders));
                break;
            }
        }
    }

    async getStoreAnalytics(merchantId: string): Promise<StoreAnalytics> {
        await this.simulateLatency();
        const key = `omnora_cloud_orders_${merchantId}`;
        const orders: Order[] = JSON.parse(localStorage.getItem(key) || '[]');
        const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'PAID' ? o.totalAmount : 0), 0);

        const dailyStats: DailyStat[] = Array.from({ length: 30 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
                date: date.toISOString().split('T')[0],
                revenue: Math.floor(Math.random() * 5000),
                orders: Math.floor(Math.random() * 10),
                views: Math.floor(Math.random() * 200) + 50
            };
        });

        return {
            totalRevenue,
            orderCount: orders.length,
            averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
            recentOrders: orders.slice(0, 5),
            views: 1240, 
            conversionRate: 3.2,
            dailyStats
        };
    }

    async trackInteraction(_merchantId: string, _event: any): Promise<void> {
        // Mock implementation
        console.log('[MockDB] Interaction tracked:', _event.eventType);
    }

    // ── Payments ──────────────────────────────────────────────────────────

    async createCheckoutSession(orderId: string, amount: number, currency: string): Promise<CheckoutSession> {
        await this.simulateLatency(800);
        // Simulated Stripe Checkout Session
        const session: CheckoutSession = {
            sessionId: `cs_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            orderId,
            checkoutUrl: `https://checkout.stripe.com/pay/cs_mock_${orderId}`,
            amount,
            currency,
            status: 'pending',
        };
        console.log(
            `%c[Omnora Payments] 💳 Checkout session created%c\n  Session: ${session.sessionId}\n  Amount: $${(amount / 100).toFixed(2)} ${currency}\n  URL: ${session.checkoutUrl}`,
            'color: #7c6dfa; font-weight: bold;',
            'color: #a1a1aa;'
        );
        return session;
    }

    // ── Products (Phase 15) ───────────────────────────────────────────────

    async getProductsByMerchant(merchantId: string): Promise<Product[]> {
        await this.simulateLatency();
        const key = `omnora_products_${merchantId}`;
        try { return JSON.parse(localStorage.getItem(key) || '[]'); }
        catch { return []; }
    }

    async createProduct(merchantId: string, product: Omit<Product, 'id'>): Promise<Product> {
        await this.simulateLatency();
        const newProduct: Product = { ...product, id: `prod_${Date.now()}` } as Product;
        const key = `omnora_products_${merchantId}`;
        const products: Product[] = JSON.parse(localStorage.getItem(key) || '[]');
        products.push(newProduct);
        localStorage.setItem(key, JSON.stringify(products));
        return newProduct;
    }

    async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
        await this.simulateLatency();
        // Scan all merchant keys to find the product
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith('omnora_products_')) continue;
            const products: Product[] = JSON.parse(localStorage.getItem(k) || '[]');
            const idx = products.findIndex(p => p.id === productId);
            if (idx >= 0) {
                products[idx] = { ...products[idx], ...updates };
                localStorage.setItem(k, JSON.stringify(products));
                return products[idx];
            }
        }
        throw new Error(`Product ${productId} not found.`);
    }

    async deleteProduct(merchantId: string, productId: string): Promise<void> {
        await this.simulateLatency();
        const key = `omnora_products_${merchantId}`;
        const products: Product[] = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(products.filter(p => p.id !== productId)));
    }

    // ── Categories (Phase 58 Mock) ──────────────────────────────────────
    async getCategories(merchantId: string): Promise<Category[]> {
        await this.simulateLatency();
        const key = `omnora_categories_${merchantId}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    async upsertCategory(merchantId: string, category: Partial<Category>): Promise<Category> {
        await this.simulateLatency();
        const key = `omnora_categories_${merchantId}`;
        const categories: Category[] = JSON.parse(localStorage.getItem(key) || '[]');
        const existingIdx = categories.findIndex(c => c.id === category.id);
        
        const newCat: Category = {
            id: category.id || `cat_${Date.now()}`,
            merchantId,
            name: category.name || 'New Category',
            slug: category.slug || 'new-category',
            description: category.description,
            parentId: category.parentId,
            createdAt: category.createdAt || new Date().toISOString()
        };

        if (existingIdx >= 0) categories[existingIdx] = newCat;
        else categories.push(newCat);

        localStorage.setItem(key, JSON.stringify(categories));
        return newCat;
    }

    async deleteCategory(merchantId: string, categoryId: string): Promise<void> {
        await this.simulateLatency();
        const key = `omnora_categories_${merchantId}`;
        const categories: Category[] = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(categories.filter(c => c.id !== categoryId)));
    }

    // ── Pages (Phase 17) ─────────────────────────────────────────────────

    async getPagesByMerchant(merchantId: string): Promise<CustomPage[]> {
        await this.simulateLatency();
        const key = `omnora_pages_${merchantId}`;
        try { return JSON.parse(localStorage.getItem(key) || '[]'); }
        catch { return []; }
    }

    async createPage(merchantId: string, page: Omit<CustomPage, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>): Promise<CustomPage> {
        await this.simulateLatency();
        const now = new Date().toISOString();
        const newPage: CustomPage = {
            ...page, id: `page_${Date.now()}`, merchantId, createdAt: now, updatedAt: now,
        };
        const key = `omnora_pages_${merchantId}`;
        const pages: CustomPage[] = JSON.parse(localStorage.getItem(key) || '[]');
        pages.push(newPage);
        localStorage.setItem(key, JSON.stringify(pages));
        return newPage;
    }

    async updatePage(pageId: string, updates: Partial<CustomPage>): Promise<CustomPage> {
        await this.simulateLatency();
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith('omnora_pages_')) continue;
            const pages: CustomPage[] = JSON.parse(localStorage.getItem(k) || '[]');
            const idx = pages.findIndex(p => p.id === pageId);
            if (idx >= 0) {
                pages[idx] = { ...pages[idx], ...updates, updatedAt: new Date().toISOString() };
                localStorage.setItem(k, JSON.stringify(pages));
                return pages[idx];
            }
        }
        throw new Error(`Page ${pageId} not found.`);
    }

    async deletePage(merchantId: string, pageId: string): Promise<void> {
        await this.simulateLatency();
        const key = `omnora_pages_${merchantId}`;
        const pages: CustomPage[] = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(pages.filter(p => p.id !== pageId)));
    }

    // ── Navigation Menus (Phase 17) ──────────────────────────────────────

    async saveNavMenu(merchantId: string, name: string, links: NavLink[]): Promise<NavMenu> {
        await this.simulateLatency();
        const key = `omnora_navmenus_${merchantId}`;
        const menus: NavMenu[] = JSON.parse(localStorage.getItem(key) || '[]');
        const existing = menus.findIndex(m => m.name === name);
        const menu: NavMenu = {
            id: existing >= 0 ? menus[existing].id : `nav_${Date.now()}`,
            merchantId, name, links,
            updatedAt: new Date().toISOString(),
        };
        if (existing >= 0) { menus[existing] = menu; } else { menus.push(menu); }
        localStorage.setItem(key, JSON.stringify(menus));
        return menu;
    }

    async getNavMenu(merchantId: string, name: string): Promise<NavMenu | null> {
        await this.simulateLatency();
        const key = `omnora_navmenus_${merchantId}`;
        try {
            const menus: NavMenu[] = JSON.parse(localStorage.getItem(key) || '[]');
            return menus.find(m => m.name === name) || null;
        } catch { return null; }
    }

    // ── Discounts (Phase 18) ─────────────────────────────────────────

    async createDiscount(merchantId: string, discount: Omit<DiscountCode, 'id' | 'merchantId' | 'usageCount' | 'createdAt'>): Promise<DiscountCode> {
        await this.simulateLatency();
        const key = `omnora_discounts_${merchantId}`;
        const list: DiscountCode[] = JSON.parse(localStorage.getItem(key) || '[]');
        const newDiscount: DiscountCode = {
            ...discount, id: `disc_${Date.now()}`, merchantId,
            usageCount: 0, createdAt: new Date().toISOString(),
        };
        list.push(newDiscount);
        localStorage.setItem(key, JSON.stringify(list));
        return newDiscount;
    }

    async getDiscountsByMerchant(merchantId: string): Promise<DiscountCode[]> {
        await this.simulateLatency();
        const key = `omnora_discounts_${merchantId}`;
        try { return JSON.parse(localStorage.getItem(key) || '[]'); }
        catch { return []; }
    }

    async updateDiscount(discountId: string, updates: Partial<DiscountCode>): Promise<DiscountCode> {
        await this.simulateLatency();
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith('omnora_discounts_')) continue;
            const list: DiscountCode[] = JSON.parse(localStorage.getItem(k) || '[]');
            const idx = list.findIndex(d => d.id === discountId);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...updates };
                localStorage.setItem(k, JSON.stringify(list));
                return list[idx];
            }
        }
        throw new Error(`Discount ${discountId} not found.`);
    }

    async deleteDiscount(merchantId: string, discountId: string): Promise<void> {
        await this.simulateLatency();
        const key = `omnora_discounts_${merchantId}`;
        const list: DiscountCode[] = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(list.filter(d => d.id !== discountId)));
    }

    async validateDiscountCode(code: string, merchantId: string): Promise<DiscountCode | null> {
        await this.simulateLatency(200);
        const key = `omnora_discounts_${merchantId}`;
        try {
            const list: DiscountCode[] = JSON.parse(localStorage.getItem(key) || '[]');
            const match = list.find(d => d.code.toUpperCase() === code.toUpperCase() && d.isActive);
            if (!match) return null;
            if (match.usageLimit && match.usageCount >= match.usageLimit) return null;
            return match;
        } catch { return null; }
    }

    // ── Payment Gateway (BYOK) ───────────────────────────────────────────
    async getMerchantPaymentSettings(merchantId: string): Promise<any> {
        await this.simulateLatency(200);
        const users = this.loadUsers();
        const user = users.find(u => u.id === merchantId);
        return user?.paymentSettings || { 
            stripePublicKey: 'pk_test_mock', 
            hasStripeConfigured: true 
        };
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private loadUsers(): MerchantUser[] {
        try { return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]'); }
        catch { return []; }
    }

    private loadConfigs(): StoreConfigRecord[] {
        try { return JSON.parse(localStorage.getItem(MOCK_CONFIGS_KEY) || '[]'); }
        catch { return []; }
    }

    async getProductById(productId: string): Promise<Product | null> {
        await this.simulateLatency();
        return null;
    }

    private simulateLatency(ms: number = 300): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }
}

// ─── Singleton Export (Environment-Aware DI) ──────────────────────────────────

function createDatabaseClient(): IDatabaseClient {
    const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    if (supabaseUrl) {
        console.log('%c[Omnora] ☁️ Using Supabase Cloud Database', 'color: #7c6dfa; font-weight: bold;');
        return new SupabaseDatabaseClient(supabase);
    }
    console.log('%c[Omnora] 💾 Using Mock Database (localStorage)', 'color: #f59e0b; font-weight: bold;');
    return new MockDatabaseClient();
}

export const databaseClient: IDatabaseClient = createDatabaseClient();

