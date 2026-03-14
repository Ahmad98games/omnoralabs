const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../../shared/lib/supabaseClient');
const logger = require('../../shared/services/logger');

/**
 * Checkout Domain Service
 * 
 * Orchestrates payments, orders, and secure webhooks via Supabase & Stripe.
 * profit.
 */
class CheckoutService {
    /**
     * Create a secure Stripe Checkout session.
     */
    async createSession(merchantId, { items, successUrl, cancelUrl }) {
        try {
            // 1. Fetch real prices from Supabase (Trust No One)
            const { data: products } = await supabase
                .from('products')
                .select('id, title, base_price')
                .in('id', items.map(i => i.id))
                .eq('merchant_id', merchantId);

            const lineItems = items.map(item => {
                const product = products.find(p => p.id === item.id);
                if (!product) throw new Error(`Product not found: ${item.id}`);

                return {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: product.title },
                        unit_amount: Math.round(product.base_price * 100),
                    },
                    quantity: item.quantity,
                };
            });

            // 2. Create Stripe Session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    merchantId,
                    cartItems: JSON.stringify(items.map(i => ({ id: i.id, q: i.quantity })))
                }
            });

            return { url: session.url, sessionId: session.id };
        } catch (err) {
            logger.error('STRIPE_SESSION_ERR', { error: err.message, merchantId });
            throw err;
        }
    }

    /**
     * Handle Stripe Webhooks (The Ledger)
     */
    async handleWebhook(event) {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { merchantId, cartItems } = session.metadata;
            const items = JSON.parse(cartItems);

            // 1. Create Order in Supabase
            const { data: order, error: orderErr } = await supabase
                .from('orders')
                .insert({
                    merchant_id: merchantId,
                    customer_email: session.customer_details.email,
                    grand_total: session.amount_total / 100,
                    financial_status: 'paid',
                    payment_method: 'stripe',
                    payment_id: session.id
                })
                .select()
                .single();

            if (orderErr) throw orderErr;

            // 2. Atomic Inventory Deduction (RPC)
            // profit.
            const { error: invErr } = await supabase.rpc('decrement_inventory_batch', {
                p_items: items.map(i => ({ product_id: i.id, quantity: i.q }))
            });

            if (invErr) {
                logger.error('INVENTORY_DEDUCTION_FAILED', { orderId: order.id, error: invErr });
                // Note: In production, we'd trigger a refund or alert human support.
            }

            logger.info('CHECKOUT_COMPLETED', { orderId: order.id, merchantId });
            return order;
        }
    }
}

module.exports = new CheckoutService();
