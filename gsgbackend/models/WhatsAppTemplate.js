const { createModel } = require('../utils/modelFactory');

const schema = {
    sellerId: { type: String, required: true },
    eventName: {
        type: String,
        required: true,
        enum: ['order.created', 'order.shipped', 'order.delivered', 'cart.abandoned', 'customer.reorder']
    },
    templateText: {
        type: String,
        required: true,
        // Supports {{name}}, {{orderId}}, {{total}}, {{trackingNumber}}, {{storeName}}, {{productName}}
    },
    isActive: { type: Boolean, default: true },

    // Anti-spam controls
    timingWindowStart: { type: Number, default: 9 }, // Hour (0–23) — no messages before this
    timingWindowEnd: { type: Number, default: 21 }, // Hour (0–23) — no messages after this
    minGapHours: { type: Number, default: 24 }, // Min hours between same event type per customer
};

const DEFAULT_TEMPLATES = {
    'order.created': 'Hello {{name}}! 🎉 Your order #{{orderId}} is confirmed. Total: PKR {{total}}. We\'ll notify you when it ships. Thank you for shopping with {{storeName}}!',
    'order.shipped': 'Hi {{name}}! 📦 Your order #{{orderId}} has been shipped. Tracking: {{trackingNumber}}. Expected delivery: 2-3 days. Reply "Track {{orderId}}" for live updates!',
    'order.delivered': 'Hi {{name}}! ✅ Your order #{{orderId}} has been delivered. Hope you love it! Please share your experience: {{reviewLink}}. Shop again: {{storeLink}}',
    'cart.abandoned': 'Hi {{name}}! 🛍️ You left something in your cart. Complete your purchase before it sells out: {{cartLink}}. Need help? Reply to this message!',
    'customer.reorder': 'Hi {{name}}! 💛 It\'s been a while! Your favorites are still available at {{storeName}}. Shop now: {{storeLink}}',
};

module.exports = createModel('WhatsAppTemplate', schema, {
    indexes: [{ fields: { sellerId: 1, eventName: 1 }, options: { unique: true } }]
});
module.exports.DEFAULT_TEMPLATES = DEFAULT_TEMPLATES;
