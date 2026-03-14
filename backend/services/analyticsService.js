/**
 * analyticsService.js
 * Seller-scoped analytics: revenue, conversion, top products, repeat customers.
 */
const logger = require('./logger');

const getModels = () => ({
    Order: require('../models/Order'),
    Product: require('../models/Product'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
}

function getSellerQuery(sellerId) {
    // Some orders may reference sellerId directly, others via product
    return sellerId ? { sellerId } : {};
}

// ─── Overview ─────────────────────────────────────────────────────────────────

async function getOverview(sellerId) {
    const { Order } = getModels();
    const { start: start30 } = dateRange(30);
    const { start: start7 } = dateRange(7);

    const baseQuery = getSellerQuery(sellerId);
    const recentQuery30 = { ...baseQuery, createdAt: { $gte: start30 } };
    const recentQuery7 = { ...baseQuery, createdAt: { $gte: start7 } };

    // Parallel fetch
    const [allOrders, orders30, orders7] = await Promise.all([
        Order.find(baseQuery),
        Order.find(recentQuery30),
        Order.find(recentQuery7),
    ]);

    const totalRevenue = allOrders
        .filter(o => ['delivered', 'approved', 'processing'].includes(o.status))
        .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

    const revenue30 = orders30
        .filter(o => ['delivered', 'approved', 'processing'].includes(o.status))
        .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

    const revenue7 = orders7
        .filter(o => ['delivered', 'approved', 'processing'].includes(o.status))
        .reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

    const totalOrders = allOrders.length;
    const orders30Count = orders30.length;
    const aov = orders30Count > 0 ? Math.round(revenue30 / orders30Count) : 0;

    // Conversion rate: delivered / total (simplified — needs traffic data for real CR)
    const delivered30 = orders30.filter(o => o.status === 'delivered').length;
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
    const { Order } = getModels();
    const { start } = dateRange(days);
    const baseQuery = { ...getSellerQuery(sellerId), createdAt: { $gte: start } };

    const orders = await Order.find(baseQuery);

    // Build day-by-day map
    const chartMap = {};
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split('T')[0];
        chartMap[key] = { date: key, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
        if (!['delivered', 'approved', 'processing'].includes(order.status)) return;
        const key = new Date(order.createdAt).toISOString().split('T')[0];
        if (chartMap[key]) {
            chartMap[key].revenue += (order.totalAmount || order.total || 0);
            chartMap[key].orders += 1;
        }
    });

    return Object.values(chartMap);
}

// ─── Top products ────────────────────────────────────────────────────────────

async function getTopProducts(sellerId, limit = 10) {
    const { Order } = getModels();
    const { start } = dateRange(30);
    const orders = await Order.find({
        ...getSellerQuery(sellerId),
        createdAt: { $gte: start }
    });

    const productMap = {};
    orders.forEach(order => {
        (order.items || []).forEach(item => {
            const key = item.product || item.name;
            if (!productMap[key]) {
                productMap[key] = { productId: key, name: item.name, revenue: 0, unitsSold: 0, image: item.image };
            }
            productMap[key].revenue += (item.price || 0) * (item.quantity || 1);
            productMap[key].unitsSold += (item.quantity || 1);
        });
    });

    return Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
}

// ─── Customer insights ────────────────────────────────────────────────────────

async function getCustomerInsights(sellerId) {
    const { Order } = getModels();
    const orders = await Order.find(getSellerQuery(sellerId));

    const customerMap = {};
    orders.forEach(order => {
        const phone = order.customer?.phone;
        if (!phone) return;
        if (!customerMap[phone]) customerMap[phone] = { phone, orders: 0, revenue: 0, name: order.customer?.name };
        customerMap[phone].orders += 1;
        customerMap[phone].revenue += (order.totalAmount || order.total || 0);
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
