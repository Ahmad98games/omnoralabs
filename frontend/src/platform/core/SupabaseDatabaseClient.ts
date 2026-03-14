/**
 * SupabaseDatabaseClient: Production Cloud Adapter
 *
 * Implements IDatabaseClient using Supabase (PostgreSQL + Auth).
 * Maps exactly to the omnora_schema.sql tables:
 *   merchants, store_configs, products, pages, nav_menus, discount_codes, orders, order_items.
 *
 * DESIGN: Drop-in replacement for MockDatabaseClient. Same interface, real cloud.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorefrontConfig } from './DatabaseTypes';
import type { OrderCustomer, OrderLineItem } from './OrderStore';
import type { Product } from '../../context/StorefrontContext';
import type {
    IDatabaseClient,
    MerchantUser,
    StoreConfigRecord,
    CheckoutSession,
    CustomPage,
    NavLink,
    NavMenu,
    DiscountCode,
    Order,
    StoreAnalytics,
    Category,
} from './DatabaseTypes';

export class SupabaseDatabaseClient implements IDatabaseClient {
    constructor(private sb: SupabaseClient) { }

    // ── Auth ──────────────────────────────────────────────────────────────

    async signUp(email: string, password: string, displayName: string): Promise<MerchantUser> {
        const { data, error } = await this.sb.auth.signUp({
            email, password,
            options: { data: { display_name: displayName } },
        });
        if (error || !data.user) throw new Error(error?.message || 'Sign-up failed.');

        // Insert merchant row
        const merchant: MerchantUser = {
            id: data.user.id,
            email,
            displayName,
            storeName: `${displayName}'s Store`,
            storeSlug: displayName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            plan: 'free',
            createdAt: new Date().toISOString(),
        };

        const { error: insertErr } = await this.sb
            .from('merchants')
            .insert({
                id: merchant.id,
                email: merchant.email,
                password_hash: 'auth-managed',
                display_name: merchant.displayName,
                store_slug: merchant.storeSlug,
                subscription: 'free',
            });
        if (insertErr) console.error('[Supabase] Merchant insert:', insertErr.message);

        return merchant;
    }

    async signIn(email: string, password: string): Promise<MerchantUser> {
        const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw new Error(error?.message || 'Sign-in failed.');

        const { data: merchant, error: fetchErr } = await this.sb
            .from('merchants')
            .select('*')
            .eq('id', data.user.id)
            .single();
        if (fetchErr || !merchant) throw new Error('Merchant profile not found.');

        return {
            id: merchant.id,
            email: merchant.email,
            displayName: merchant.display_name,
            storeName: merchant.display_name + "'s Store",
            storeSlug: merchant.store_slug || '',
            plan: merchant.subscription || 'free',
            createdAt: merchant.created_at,
        };
    }

    async signOut(): Promise<void> {
        const { error } = await this.sb.auth.signOut();
        if (error) throw new Error(error.message);
    }

    async getProductById(productId: string): Promise<Product | null> {
        const { data, error } = await this.sb
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        if (error) return null;
        return data as Product;
    }

    async getCurrentUser(): Promise<MerchantUser | null> {
        const { data: { user } } = await this.sb.auth.getUser();
        if (!user) return null;

        const { data: merchant } = await this.sb
            .from('merchants')
            .select('*')
            .eq('id', user.id)
            .single();
        if (!merchant) return null;

        // Data Leak Prevention: Map settings without exposing raw logic keys
        let paymentSettings = undefined;
        if (merchant.payment_settings) {
            paymentSettings = {
                stripePublicKey: merchant.payment_settings.stripePublicKey || '',
                hasStripeConfigured: !!merchant.payment_settings.stripeSecretKey,
                hasWebhookConfigured: !!merchant.payment_settings.stripeWebhookSecret,
            };
        }

        return {
            id: merchant.id,
            email: merchant.email,
            displayName: merchant.display_name,
            storeName: merchant.display_name + "'s Store",
            storeSlug: merchant.store_slug || '',
            plan: merchant.subscription || 'free',
            paymentSettings,
            createdAt: merchant.created_at,
        };
    }

    // ── Payment Settings ──────────────────────────────────────────────────

    async updateMerchantPaymentSettings(updates: { stripePublicKey?: string; stripeSecretKey?: string; stripeWebhookSecret?: string; }): Promise<void> {
        const { data: { user } } = await this.sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch existing settings first so we don't accidentally overwrite with nulls
        const { data: merchant } = await this.sb
            .from('merchants')
            .select('payment_settings')
            .eq('id', user.id)
            .single();

        const currentSettings = merchant?.payment_settings || {};
        
        const newSettings = {
            ...currentSettings,
        };

        if (updates.stripePublicKey !== undefined) newSettings.stripePublicKey = updates.stripePublicKey;
        if (updates.stripeSecretKey !== undefined) newSettings.stripeSecretKey = updates.stripeSecretKey;
        if (updates.stripeWebhookSecret !== undefined) newSettings.stripeWebhookSecret = updates.stripeWebhookSecret;

        const { error } = await this.sb
            .from('merchants')
            .update({ payment_settings: newSettings })
            .eq('id', user.id);

        if (error) throw new Error(`[updateMerchantPaymentSettings] ${error.message}`);
    }

    async getMerchantPaymentSettings(merchantId: string): Promise<any> {
        const { data, error } = await this.sb
            .from('merchants')
            .select('payment_settings')
            .eq('id', merchantId)
            .single();

        if (error) throw new Error(`[getMerchantPaymentSettings] ${error.message}`);
        return data?.payment_settings || null;
    }

    // ── Store Configs (JSONB) ─────────────────────────────────────────────

    async saveStoreConfig(merchantId: string, config: StorefrontConfig, domain: string): Promise<StoreConfigRecord> {
        // Upsert: update existing config or insert new one
        const { data, error } = await this.sb
            .from('store_configs')
            .upsert({
                merchant_id: merchantId,
                node_tree: config,
                theme_vars: (config as any).themeVars || {},
                symbol_registry: (config as any).symbolRegistry || {},
                is_published: true,
                version: 1,
            }, { onConflict: 'merchant_id' })
            .select()
            .single();

        if (error) throw new Error(`[saveStoreConfig] ${error.message}`);

        // Also update custom domain on merchant if provided
        if (domain) {
            await this.sb.from('merchants').update({ custom_domain: domain }).eq('id', merchantId);
        }

        return {
            id: data.id,
            merchantId: data.merchant_id,
            config,
            domain,
            isLive: data.is_published,
            updatedAt: data.updated_at,
        };
    }

    async getStoreConfigByMerchant(merchantId: string): Promise<StoreConfigRecord | null> {
        const [configRes, merchantRes] = await Promise.all([
            this.sb.from('store_configs').select('*').eq('merchant_id', merchantId).order('updated_at', { ascending: false }).limit(1).single(),
            this.sb.from('merchants').select('subscription').eq('id', merchantId).single()
        ]);

        if (configRes.error || !configRes.data) return null;

        return {
            id: configRes.data.id,
            merchantId: configRes.data.merchant_id,
            config: configRes.data.node_tree as StorefrontConfig,
            domain: '',
            isLive: configRes.data.is_published,
            isSuspended: merchantRes.data?.subscription === 'suspended',
            updatedAt: configRes.data.updated_at,
        };
    }

    async getStoreConfigByDomain(domain: string): Promise<StoreConfigRecord | null> {
        // Look up merchant by custom_domain, then fetch their config
        const { data: merchant } = await this.sb
            .from('merchants')
            .select('id, subscription')
            .eq('custom_domain', domain)
            .single();
        if (!merchant) return null;

        const record = await this.getStoreConfigByMerchant(merchant.id);
        if (record) {
            record.isSuspended = merchant.subscription === 'suspended';
        }
        return record;
    }

    // ── Orders ────────────────────────────────────────────────────────────

    async createOrder(merchantId: string, customer: any, items: any[], subtotal: number, currency: string): Promise<Order> {
        const { data: order, error } = await this.sb
            .from('orders')
            .insert({
                merchant_id: merchantId,
                subtotal,
                grand_total: subtotal,
                currency,
                customer_email: customer.email,
                customer_name: customer.name,
                shipping_address: {
                    address: customer.address,
                    city: customer.city,
                    zip: customer.zip,
                    phone: customer.phone,
                },
                financial_status: 'PENDING',
                fulfillment_status: 'UNFULFILLED',
            })
            .select()
            .single();

        if (error || !order) throw new Error(`[createOrder] ${error?.message || 'Failed'}`);

        // Insert order items
        const itemRows = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            variant_id: item.variantId || null,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            image_url: item.image,
        }));

        const { error: itemsErr } = await this.sb.from('order_items').insert(itemRows);
        if (itemsErr) console.error('[Supabase] order_items insert:', itemsErr.message);

        return {
            id: order.id,
            merchantId,
            customerEmail: customer.email,
            customerName: customer.name,
            items,
            totalAmount: subtotal,
            status: 'PENDING',
            createdAt: order.created_at,
            currency,
        };
    }

    async getOrders(merchantId: string): Promise<Order[]> {
        const { data, error } = await this.sb
            .from('orders')
            .select('*, order_items(*)')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`[getOrders] ${error.message}`);
        if (!data) return [];

        return data.map((row: any) => ({
            id: row.id,
            merchantId: row.merchant_id,
            customerEmail: row.customer_email || '',
            customerName: row.customer_name || '',
            items: (row.order_items || []).map((item: any) => ({
                id: item.product_id || item.id,
                variantId: item.variant_id,
                title: item.title,
                price: parseFloat(item.unit_price),
                quantity: item.quantity,
                image: item.image_url || '',
            })),
            totalAmount: parseFloat(row.grand_total),
            status: (row.financial_status?.toUpperCase() as Order['status']) || 'PENDING',
            createdAt: row.created_at,
            currency: row.currency,
        }));
    }

    async getStoreAnalytics(merchantId: string): Promise<StoreAnalytics> {
        // 1. Call the High-Fidelity Analytics RPC
        const { data, error } = await this.sb.rpc('get_high_fidelity_stats', {
            p_merchant_id: merchantId
        });

        if (error) {
            console.error('[Supabase] getStoreAnalytics RPC Error:', error);
            throw new Error(`Failed to fetch high-fidelity analytics: ${error.message}`);
        }

        // 2. Fetch Recent Orders (kept separate for depth if needed)
        const orders = await this.getOrders(merchantId);
        
        const kpis = data.kpis;
        const dailyStats = data.dailyStats;

        return {
            totalRevenue: parseFloat(kpis.totalRevenue) || 0,
            orderCount: parseInt(kpis.orderCount) || 0,
            views: parseInt(kpis.views) || 0,
            conversionRate: parseFloat(kpis.conversionRate) || 0,
            averageOrderValue: kpis.orderCount > 0 ? parseFloat(kpis.totalRevenue) / parseInt(kpis.orderCount) : 0,
            recentOrders: orders.slice(0, 5),
            dailyStats: dailyStats || []
        };
    }

    async trackInteraction(merchantId: string, event: {
        eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'purchase';
        productId?: string;
        sessionId?: string;
        metadata?: any;
    }): Promise<void> {
        const { error } = await this.sb
            .from('interaction_logs')
            .insert({
                merchant_id: merchantId,
                event_type: event.eventType,
                product_id: event.productId || null,
                session_id: event.sessionId || 'anon',
                metadata: event.metadata || {}
            });

        if (error) {
            console.error('[Supabase] trackInteraction Error:', error.message);
        }
    }

    async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
        const { error } = await this.sb
            .from('orders')
            .update({ financial_status: status })
            .eq('id', orderId);
        if (error) throw new Error(`[updateOrderStatus] ${error.message}`);
    }

    // ── Payments (Stripe mock — same as before) ──────────────────────────

    async createCheckoutSession(orderId: string, amount: number, currency: string): Promise<CheckoutSession> {
        // In production: call a Supabase Edge Function that creates a real Stripe session.
        // For now: mock it like MockDatabaseClient did.
        const session: CheckoutSession = {
            sessionId: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            orderId,
            checkoutUrl: `https://checkout.stripe.com/pay/cs_mock_${orderId}`,
            amount,
            currency,
            status: 'pending',
        };
        console.log(`[Supabase] 💳 Checkout session created: ${session.sessionId} (${amount} ${currency})`);
        return session;
    }

    // ── Products (Phase 15/58) ───────────────────────────────────────────────
    async getProductsByMerchant(merchantId: string): Promise<Product[]> {
        const { data, error } = await this.sb
            .from('products')
            .select('*, product_variants(*), product_images(*), categories(name)')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`[getProducts] ${error.message}`);

        return (data || []).map((row: any) => this.mapProduct(row));
    }

    async createProduct(merchantId: string, product: Omit<Product, 'id'>): Promise<Product> {
        // 1. Insert Base Product
        const { data: productData, error: productErr } = await this.sb
            .from('products')
            .insert({
                merchant_id: merchantId,
                title: product.title,
                description: product.description || '',
                handle: product.handle,
                base_price: product.price,
                compare_at_price: product.compareAtPrice || null,
                featured_image: product.featured_image,
                status: 'active',
            })
            .select()
            .single();

        if (productErr || !productData) throw new Error(`[createProduct] ${productErr?.message || 'Failed'}`);

        // 2. Insert Variants (if any)
        if (product.variants && product.variants.length > 0) {
            const variantRows = product.variants.map(v => ({
                product_id: productData.id,
                title: v.title,
                sku: v.sku,
                price_override: v.price !== product.price ? v.price : null,
                stock_quantity: v.available ? 100 : 0, // Placeholder stock
                options: v.options,
                image_url: v.image
            }));
            await this.sb.from('product_variants').insert(variantRows);
        }

        // 3. Insert Gallery Images
        if (product.images && product.images.length > 0) {
            const imageRows = product.images.map((img, idx) => ({
                product_id: productData.id,
                url: img.src,
                alt_text: img.alt,
                position: idx
            }));
            await this.sb.from('product_images').insert(imageRows);
        }

        return this.getProductsByMerchant(merchantId).then(list => list.find(p => p.id === productData.id)!);
    }

    async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
        const baseMapped: Record<string, any> = {};
        if (updates.title !== undefined) baseMapped.title = updates.title;
        if (updates.description !== undefined) baseMapped.description = updates.description;
        if (updates.handle !== undefined) baseMapped.handle = updates.handle;
        if (updates.price !== undefined) baseMapped.base_price = updates.price;
        if (updates.compareAtPrice !== undefined) baseMapped.compare_at_price = updates.compareAtPrice;
        if (updates.featured_image !== undefined) baseMapped.featured_image = updates.featured_image;

        // Update Base
        if (Object.keys(baseMapped).length > 0) {
            const { error } = await this.sb.from('products').update(baseMapped).eq('id', productId);
            if (error) throw new Error(`[updateProduct:base] ${error.message}`);
        }

        // Update Variants (Full Replace for Sync)
        if (updates.variants !== undefined) {
            await this.sb.from('product_variants').delete().eq('product_id', productId);
            if (updates.variants.length > 0) {
                const variantRows = updates.variants.map(v => ({
                    product_id: productId,
                    title: v.title,
                    sku: v.sku,
                    price_override: v.price,
                    stock_quantity: v.available ? 100 : 0,
                    options: v.options,
                    image_url: v.image
                }));
                await this.sb.from('product_variants').insert(variantRows);
            }
        }

        // Update Images (Full Replace)
        if (updates.images !== undefined) {
            await this.sb.from('product_images').delete().eq('product_id', productId);
            if (updates.images.length > 0) {
                const imageRows = updates.images.map((img, idx) => ({
                    product_id: productId,
                    url: img.src,
                    alt_text: img.alt,
                    position: idx
                }));
                await this.sb.from('product_images').insert(imageRows);
            }
        }

        const { data: user } = await this.sb.auth.getUser();
        return this.getProductsByMerchant(user.user?.id || '').then(list => list.find(p => p.id === productId)!);
    }

    async deleteProduct(merchantId: string, productId: string): Promise<void> {
        const { error } = await this.sb
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('merchant_id', merchantId);
        if (error) throw new Error(`[deleteProduct] ${error.message}`);
    }

    // ── Categories (Phase 58) ────────────────────────────────────────────

    async getCategories(merchantId: string): Promise<Category[]> {
        const { data, error } = await this.sb
            .from('categories')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('name', { ascending: true });

        if (error) throw new Error(`[getCategories] ${error.message}`);
        return (data || []).map((row: any) => ({
            id: row.id,
            merchantId: row.merchant_id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            parentId: row.parent_id,
            createdAt: row.created_at,
        }));
    }

    async upsertCategory(merchantId: string, category: Partial<Category>): Promise<Category> {
        const { data, error } = await this.sb
            .from('categories')
            .upsert({
                id: category.id,
                merchant_id: merchantId,
                name: category.name,
                slug: category.slug,
                description: category.description,
                parent_id: category.parentId,
            })
            .select()
            .single();

        if (error || !data) throw new Error(`[upsertCategory] ${error?.message || 'Failed'}`);
        return {
            id: data.id,
            merchantId: data.merchant_id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            parentId: data.parent_id,
            createdAt: data.created_at,
        };
    }

    async deleteCategory(merchantId: string, categoryId: string): Promise<void> {
        const { error } = await this.sb
            .from('categories')
            .delete()
            .eq('id', categoryId)
            .eq('merchant_id', merchantId);
        if (error) throw new Error(`[deleteCategory] ${error.message}`);
    }

    private mapProduct(row: any): Product {
        return {
            id: row.id,
            title: row.title,
            description: row.description || '',
            handle: row.handle,
            vendor: row.vendor || '',
            type: row.categories?.name || row.product_type || '', // Use category name as type if available
            tags: row.tags || [],
            price: parseFloat(row.base_price),
            compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : undefined,
            currency: row.currency || 'USD',
            featured_image: row.featured_image || '',
            images: (row.product_images || []).map((img: any) => ({
                id: img.id,
                src: img.url,
                alt: img.alt_text || ''
            })),
            options: row.options || [], // In a full relational model, options would be derived from variants
            variants: (row.product_variants || []).map((v: any) => ({
                id: v.id,
                title: v.title,
                price: parseFloat(v.price_override || row.base_price),
                compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : undefined,
                sku: v.sku,
                available: v.stock_quantity > 0,
                options: v.options,
                image: v.image_url
            })),
            available: row.status === 'active',
        };
    }

    // ── Pages (Phase 17) ──────────────────────────────────────────────────

    async getPagesByMerchant(merchantId: string): Promise<CustomPage[]> {
        const { data, error } = await this.sb
            .from('pages')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`[getPages] ${error.message}`);

        return (data || []).map((row: any): CustomPage => ({
            id: row.id,
            merchantId: row.merchant_id,
            title: row.title,
            slug: row.slug,
            status: row.status,
            nodeIds: row.node_tree?.nodeIds || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }

    async createPage(merchantId: string, page: Omit<CustomPage, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>): Promise<CustomPage> {
        const { data, error } = await this.sb
            .from('pages')
            .insert({
                merchant_id: merchantId,
                title: page.title,
                slug: page.slug,
                status: page.status,
                node_tree: { nodeIds: page.nodeIds || [] },
            })
            .select()
            .single();

        if (error || !data) throw new Error(`[createPage] ${error?.message || 'Failed'}`);

        return {
            id: data.id,
            merchantId: data.merchant_id,
            title: data.title,
            slug: data.slug,
            status: data.status,
            nodeIds: data.node_tree?.nodeIds || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    async updatePage(pageId: string, updates: Partial<CustomPage>): Promise<CustomPage> {
        const mapped: Record<string, any> = {};
        if (updates.title !== undefined) mapped.title = updates.title;
        if (updates.slug !== undefined) mapped.slug = updates.slug;
        if (updates.status !== undefined) mapped.status = updates.status;
        if (updates.nodeIds !== undefined) mapped.node_tree = { nodeIds: updates.nodeIds };

        const { data, error } = await this.sb
            .from('pages')
            .update(mapped)
            .eq('id', pageId)
            .select()
            .single();

        if (error || !data) throw new Error(`[updatePage] ${error?.message || 'Failed'}`);

        return {
            id: data.id,
            merchantId: data.merchant_id,
            title: data.title,
            slug: data.slug,
            status: data.status,
            nodeIds: data.node_tree?.nodeIds || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    async deletePage(merchantId: string, pageId: string): Promise<void> {
        const { error } = await this.sb
            .from('pages')
            .delete()
            .eq('id', pageId)
            .eq('merchant_id', merchantId);
        if (error) throw new Error(`[deletePage] ${error.message}`);
    }

    // ── Navigation Menus (Phase 17) ───────────────────────────────────────

    async saveNavMenu(merchantId: string, name: string, links: NavLink[]): Promise<NavMenu> {
        const { data, error } = await this.sb
            .from('nav_menus')
            .upsert({
                merchant_id: merchantId,
                name,
                links,
            }, { onConflict: 'merchant_id,name' })
            .select()
            .single();

        if (error || !data) throw new Error(`[saveNavMenu] ${error?.message || 'Failed'}`);

        return {
            id: data.id,
            merchantId: data.merchant_id,
            name: data.name,
            links: data.links || [],
            updatedAt: data.updated_at,
        };
    }

    async getNavMenu(merchantId: string, name: string): Promise<NavMenu | null> {
        const { data, error } = await this.sb
            .from('nav_menus')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('name', name)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            merchantId: data.merchant_id,
            name: data.name,
            links: data.links || [],
            updatedAt: data.updated_at,
        };
    }

    // ── Discounts (Phase 18) ──────────────────────────────────────────────

    async createDiscount(merchantId: string, discount: Omit<DiscountCode, 'id' | 'merchantId' | 'usageCount' | 'createdAt'>): Promise<DiscountCode> {
        const { data, error } = await this.sb
            .from('discount_codes')
            .insert({
                merchant_id: merchantId,
                code: discount.code,
                type: discount.type,
                value: discount.value,
                is_active: discount.isActive,
                usage_limit: discount.usageLimit || null,
                usage_count: 0,
            })
            .select()
            .single();

        if (error || !data) throw new Error(`[createDiscount] ${error?.message || 'Failed'}`);
        return this.mapDiscount(data);
    }

    async getDiscountsByMerchant(merchantId: string): Promise<DiscountCode[]> {
        const { data, error } = await this.sb
            .from('discount_codes')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`[getDiscounts] ${error.message}`);
        return (data || []).map((row: any) => this.mapDiscount(row));
    }

    async updateDiscount(discountId: string, updates: Partial<DiscountCode>): Promise<DiscountCode> {
        const mapped: Record<string, any> = {};
        if (updates.code !== undefined) mapped.code = updates.code;
        if (updates.type !== undefined) mapped.type = updates.type;
        if (updates.value !== undefined) mapped.value = updates.value;
        if (updates.isActive !== undefined) mapped.is_active = updates.isActive;
        if (updates.usageLimit !== undefined) mapped.usage_limit = updates.usageLimit;
        if (updates.usageCount !== undefined) mapped.usage_count = updates.usageCount;

        const { data, error } = await this.sb
            .from('discount_codes')
            .update(mapped)
            .eq('id', discountId)
            .select()
            .single();

        if (error || !data) throw new Error(`[updateDiscount] ${error?.message || 'Failed'}`);
        return this.mapDiscount(data);
    }

    async deleteDiscount(merchantId: string, discountId: string): Promise<void> {
        const { error } = await this.sb
            .from('discount_codes')
            .delete()
            .eq('id', discountId)
            .eq('merchant_id', merchantId);
        if (error) throw new Error(`[deleteDiscount] ${error.message}`);
    }

    async validateDiscountCode(code: string, merchantId: string): Promise<DiscountCode | null> {
        const { data, error } = await this.sb
            .from('discount_codes')
            .select('*')
            .eq('merchant_id', merchantId)
            .ilike('code', code)
            .eq('is_active', true)
            .single();

        if (error || !data) return null;

        // Check usage limit
        if (data.usage_limit && data.usage_count >= data.usage_limit) return null;

        return this.mapDiscount(data);
    }

    private mapDiscount(row: any): DiscountCode {
        return {
            id: row.id,
            merchantId: row.merchant_id,
            code: row.code,
            type: row.type,
            value: parseFloat(row.value),
            isActive: row.is_active,
            usageLimit: row.usage_limit || undefined,
            usageCount: row.usage_count || 0,
            createdAt: row.created_at,
        };
    }
}
