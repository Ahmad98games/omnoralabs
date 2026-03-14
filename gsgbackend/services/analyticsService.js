/**
 * analyticsService.js
 * Seller-scoped analytics: revenue, conversion, top products, repeat customers.
 */
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const logger = require('./logger');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// No more getModels needed, using direct supabase client

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
}

function getSellerQuery(sellerId) {
    return sellerId ? { merchant_id: sellerId } : {};
}

// ─── Overview ─────────────────────────────────────────────────────────────────

async function getOverview(sellerId) {
    const { start: start30 } = dateRange(30);
    const { start: start7 } = dateRange(7);

    if (!uuidRegex.test(sellerId)) {
        return { totalRevenue: 0, revenue30: 0, revenue7: 0, totalOrders: 0, orders30: 0, aov: 0, conversionRate: 0 };
    }

    // parallel fetches from Supabase
    const [allOrdersRes, orders30Res, orders7Res] = await Promise.all([
        supabase.from('orders').select('*').eq('merchant_id', sellerId),
        supabase.from('orders').select('*').eq('merchant_id', sellerId).gte('created_at', start30.toISOString()),
        supabase.from('orders').select('*').eq('merchant_id', sellerId).gte('created_at', start7.toISOString())
    ]);

    const allOrders = allOrdersRes.data || [];
    const orders30 = orders30Res.data || [];

    const totalRevenue = allOrders
        .filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.financial_status) || o.fulfillment_status !== 'cancelled')
        .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    const revenue30 = orders30
        .filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.financial_status) || o.fulfillment_status !== 'cancelled')
        .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    const revenue7 = (orders7Res.data || [])
        .filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.financial_status) || o.fulfillment_status !== 'cancelled')
        .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    const totalOrders = allOrders.length;
    const orders30Count = orders30.length;
    const aov = orders30Count > 0 ? Math.round(revenue30 / orders30Count) : 0;

    // Conversion rate: simplified proxy
    const delivered30 = orders30.filter(o => o.fulfillment_status === 'delivered').length;
    const conversionRate = orders30Count > 0 ? ((delivered30 / orders30Count) * 100).toFixed(1) : 0;

    return {
        totalRevenue,
        revenue30,
        revenue7,
        totalOrders,
        orders30: orders30Count,
        aov,
        conversionRate: parseFloat(conversionRate),
    };
}

// ─── Revenue chart (last N days) ─────────────────────────────────────────────

async function getRevenueChart(sellerId, days = 30) {
    const { start } = dateRange(days);
    const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, grand_total, financial_status, fulfillment_status')
        .eq('merchant_id', sellerId)
        .gte('created_at', start.toISOString());

    if (error) throw error;

    // Build day-by-day map
    const chartMap = {};
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split('T')[0];
        chartMap[key] = { date: key, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
        if (order.fulfillment_status === 'cancelled') return;
        const key = new Date(order.created_at).toISOString().split('T')[0];
        if (chartMap[key]) {
            chartMap[key].revenue += (order.grand_total || 0);
            chartMap[key].orders += 1;
        }
    });

    return Object.values(chartMap);
}

// ─── Top products ────────────────────────────────────────────────────────────

async function getTopProducts(sellerId, limit = 10) {
    const { start } = dateRange(30);
    // Join with order_items
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_items(*)')
        .eq('merchant_id', sellerId)
        .gte('created_at', start.toISOString());

    if (error) throw error;

    const productMap = {};
    orders.forEach(order => {
        (order.order_items || []).forEach(item => {
            const key = item.product_id || item.product_name;
            if (!productMap[key]) {
                productMap[key] = { productId: key, name: item.product_name, revenue: 0, unitsSold: 0, image: item.product_image };
            }
            productMap[key].revenue += (item.unit_price || 0) * (item.quantity || 1);
            productMap[key].unitsSold += (item.quantity || 1);
        });
    });

    return Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
}

// ─── Customer insights ────────────────────────────────────────────────────────

async function getCustomerInsights(sellerId) {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('grand_total, customer_email, billing_address')
        .eq('merchant_id', sellerId);

    if (error) throw error;

    const customerMap = {};
    orders.forEach(order => {
        const email = order.customer_email;
        if (!email) return;
        if (!customerMap[email]) customerMap[email] = { email, orders: 0, revenue: 0, name: order.billing_address?.firstName || 'Customer' };
        customerMap[email].orders += 1;
        customerMap[email].revenue += (order.grand_total || 0);
    });

    const customers = Object.values(customerMap);
    const repeatCustomers = customers.filter(c => c.orders > 1).length;
    const repeatRate = customers.length > 0
        ? ((repeatCustomers / customers.length) * 100).toFixed(1)
        : 0;

    const topCustomers = customers
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    return {
        totalCustomers: customers.length,
        repeatCustomers,
        repeatRate: parseFloat(repeatRate),
        topCustomers,
    };
}

module.exports = { getOverview, getRevenueChart, getTopProducts, getCustomerInsights };
