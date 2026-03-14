/**
 * whatsappAutomationService.js
 * Event-driven WhatsApp messaging with anti-spam, opt-out, and timing controls.
 * Extends the existing whatsappService (CallMeBot) via queueService.
 */
const logger = require('./logger');
const queueService = require('./queueService');
const waRateGuard = require('./waRateGuard');

const getModels = () => ({
    WhatsAppTemplate: require('../models/WhatsAppTemplate'),
    WaOptOut: require('../models/WaOptOut'),
});

// ─── Anti-spam: check if safe to send ────────────────────────────────────────

async function canSend(phone, sellerId, eventName) {
    const { WhatsAppTemplate, WaOptOut } = getModels();

    // 1. Check opt-out list
    const optedOut = await WaOptOut.findOne({ phone, sellerId, reinstated: false });
    if (optedOut) {
        logger.info(`WA_BLOCKED: ${phone} opted out — skipping ${eventName}`);
        return false;
    }

    // 2. Check timing window from template settings
    const template = await WhatsAppTemplate.findOne({ sellerId, eventName });
    if (template) {
        const hour = new Date().getHours();
        if (hour < template.timingWindowStart || hour >= template.timingWindowEnd) {
            logger.info(`WA_TIMING: Outside window (${template.timingWindowStart}–${template.timingWindowEnd}) — skipping`);
            return false;
        }
    }

    return true;
}

// ─── Template renderer ────────────────────────────────────────────────────────

async function renderTemplate(sellerId, eventName, vars = {}) {
    const { WhatsAppTemplate } = getModels();

    let template = await WhatsAppTemplate.findOne({ sellerId, eventName, isActive: true });

    // Fall back to default templates if seller hasn't customized
    if (!template) {
        const { DEFAULT_TEMPLATES } = WhatsAppTemplate;
        const defaultText = DEFAULT_TEMPLATES?.[eventName];
        if (!defaultText) return null;
        template = { templateText: defaultText };
    }

    // Interpolate {{variables}}
    let text = template.templateText;
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
    const { WaOptOut } = getModels();
    const existing = await WaOptOut.findOne({ phone, sellerId });
    if (!existing) {
        await WaOptOut.create({ phone, sellerId });
        logger.info(`WA_OPTOUT: ${phone} opted out from seller ${sellerId}`);
    }
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
