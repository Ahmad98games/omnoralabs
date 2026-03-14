/**
 * whatsappAutomationService.js
 * Event-driven WhatsApp messaging with anti-spam, opt-out, and timing controls.
 * Extends the existing whatsappService (CallMeBot) via queueService.
 */
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const logger = require('./logger');
const queueService = require('./queueService');
const waRateGuard = require('./waRateGuard');

// ─── Anti-spam: check if safe to send ────────────────────────────────────────

async function canSend(phone, sellerId, eventName) {
    // 1. Check opt-out list
    const { data: optedOut, error: optError } = await supabase
        .from('whatsapp_optouts')
        .select('*')
        .eq('phone', phone)
        .eq('merchant_id', sellerId)
        .eq('reinstated', false)
        .maybeSingle();

    if (optedOut) {
        logger.info(`WA_BLOCKED: ${phone} opted out — skipping ${eventName}`);
        return false;
    }

    // 2. Check timing window from template settings
    const { data: template, error: tempError } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('merchant_id', sellerId)
        .eq('event_name', eventName)
        .maybeSingle();

    if (template && template.metadata) {
        const hour = new Date().getHours();
        const { timingWindowStart = 0, timingWindowEnd = 24 } = template.metadata;
        if (hour < timingWindowStart || hour >= timingWindowEnd) {
            logger.info(`WA_TIMING: Outside window (${timingWindowStart}–${timingWindowEnd}) — skipping`);
            return false;
        }
    }

    return true;
}

// ─── Template renderer ────────────────────────────────────────────────────────

async function renderTemplate(sellerId, eventName, vars = {}) {
    const { data: template, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('merchant_id', sellerId)
        .eq('event_name', eventName)
        .eq('is_active', true)
        .maybeSingle();

    let templateText = template?.template_body;

    // Fall back to default templates if seller hasn't customized
    if (!templateText) {
        const DEFAULT_TEMPLATES = {
            order_confirmation: "Hello {{name}}, your order {{orderNumber}} has been received! Total: {{amount}}. Thank you for shopping with us.",
            payment_approved: "Good news {{name}}! Your payment for order {{orderNumber}} has been approved. We'll start preparing your package.",
            order_shipped: "Hi {{name}}, your order {{orderNumber}} has been shipped! Tracking number: {{trackingNumber}}.",
            abandoned_cart: "Hi {{name}}, you left some items in your cart. Use code 'BACK5' for a special discount!",
            welcome_message: "Welcome to our store, {{name}}! We're glad to have you."
        };
        templateText = DEFAULT_TEMPLATES[eventName];
        if (!templateText) return null;
    }

    // Interpolate {{variables}}
    let text = templateText;
    Object.entries(vars).forEach(([key, val]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), val ?? '');
    });
    return text;
}

// ─── Core send trigger ────────────────────────────────────────────────────────

async function trigger(eventName, { phone, sellerId, vars = {} }) {
    try {
        // ── Global rate guard (daily cap, phone cooldown, spike detection) ────
        const guard = await waRateGuard.check(sellerId, phone);
        if (!guard.allowed) {
            logger.warn(`WA_RATE_GUARD: Blocked ${eventName} → ${phone}`, { reason: guard.reason });
            return { sent: false, reason: guard.reason };
        }

        // ── Per-seller anti-spam (opt-out + timing window) ────────────────────
        const safe = await canSend(phone, sellerId, eventName);
        if (!safe) return { sent: false, reason: 'blocked' };

        const message = await renderTemplate(sellerId, eventName, vars);
        if (!message) return { sent: false, reason: 'no_template' };

        // Queue via existing queueService (WhatsApp BullMQ queue)
        const result = await queueService.queueWhatsApp(phone, eventName, { message }, {
            orderId: vars.orderId,
            sellerId,
            priority: 5,
        });

        logger.info(`WA_QUEUED: ${eventName} → ${phone}`, { jobId: result.jobId });
        return { sent: true, jobId: result.jobId };
    } catch (err) {
        logger.error('WA_AUTOMATION: trigger failed', { eventName, phone, error: err.message });
        return { sent: false, error: err.message };
    }
}

// ─── Named event triggers ────────────────────────────────────────────────────

async function orderCreated(order, sellerId) {
    return trigger('order.created', {
        phone: order.customer?.phone,
        sellerId,
        vars: {
            name: order.customer?.name || order.customer?.firstName || 'Customer',
            orderId: order.orderNumber,
            total: order.totalAmount || order.total,
            storeName: 'Your Store',
        },
    });
}

async function orderShipped(order, trackingNumber, sellerId) {
    return trigger('order.shipped', {
        phone: order.customer?.phone,
        sellerId,
        vars: {
            name: order.customer?.name || 'Customer',
            orderId: order.orderNumber,
            trackingNumber: trackingNumber || 'N/A',
        },
    });
}

async function orderDelivered(order, sellerId) {
    return trigger('order.delivered', {
        phone: order.customer?.phone,
        sellerId,
        vars: {
            name: order.customer?.name || 'Customer',
            orderId: order.orderNumber,
        },
    });
}

async function cartAbandoned({ phone, name, sellerId, cartLink }) {
    return trigger('cart.abandoned', {
        phone,
        sellerId,
        vars: { name: name || 'Customer', cartLink: cartLink || '#' },
    });
}

async function reorderReminder({ phone, name, sellerId, storeLink }) {
    return trigger('customer.reorder', {
        phone,
        sellerId,
        vars: { name: name || 'Customer', storeLink: storeLink || '#', storeName: 'Your Store' },
    });
}

// ─── Opt-out handler (called when customer sends STOP) ────────────────────────

async function processOptOut(phone, sellerId) {
    const { error } = await supabase
        .from('whatsapp_optouts')
        .upsert({ phone, merchant_id: sellerId, reinstated: false }, { onConflict: 'phone,merchant_id' });
    
    if (error) {
        logger.error(`WA_OPTOUT_ERROR: ${error.message}`);
        return { success: false };
    }
    logger.info(`WA_OPTOUT: ${phone} opted out from seller ${sellerId}`);
    return { success: true };
}

module.exports = {
    trigger,
    orderCreated,
    orderShipped,
    orderDelivered,
    cartAbandoned,
    reorderReminder,
    processOptOut,
};
