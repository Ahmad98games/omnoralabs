const express = require('express');
const router = express.Router();
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const { protect: authenticate } = require('../middleware/auth');
const logger = require('../services/logger');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Default templates as fallback or for initialization
const DEFAULT_TEMPLATES = {
    order_confirmation: "Hello {{name}}, your order {{orderNumber}} has been received! Total: {{amount}}. Thank you for shopping with us.",
    payment_approved: "Good news {{name}}! Your payment for order {{orderNumber}} has been approved. We'll start preparing your package.",
    order_shipped: "Hi {{name}}, your order {{orderNumber}} has been shipped! Tracking number: {{trackingNumber}}.",
    abandoned_cart: "Hi {{name}}, you left some items in your cart. Use code 'BACK5' for a special discount!",
    welcome_message: "Welcome to our store, {{name}}! We're glad to have you."
};

// â”€â”€ GET /api/whatsapp-templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns all 5 event templates for the seller; creates defaults if missing
        const merchant_id = req.user.id || req.user._id;
        if (!uuidRegex.test(merchant_id)) {
            return res.json([]); // Return empty list for non-merchants
        }
        const events = Object.keys(DEFAULT_TEMPLATES);

        // Fetch existing templates
        const { data: existingTemplates, error: fetchError } = await supabase
            .from('whatsapp_templates')
            .select('*')
            .eq('merchant_id', merchant_id);

        if (fetchError) throw fetchError;

        const existingEventNames = existingTemplates.map(t => t.event_name);
        const missingEvents = events.filter(e => !existingEventNames.includes(e));

        if (missingEvents.length > 0) {
            const newTemplates = missingEvents.map(eventName => ({
                merchant_id,
                event_name: eventName,
                template_body: DEFAULT_TEMPLATES[eventName],
                is_active: true
            }));

            const { error: insertError } = await supabase
                .from('whatsapp_templates')
                .insert(newTemplates);

            if (insertError) logger.error('WA_TEMPLATES_INIT_ERROR', { error: insertError.message });
        }

        const { data: finalTemplates, error: finalError } = await supabase
            .from('whatsapp_templates')
            .select('*')
            .eq('merchant_id', merchant_id);

        if (finalError) throw finalError;
        res.json(finalTemplates);
    } catch (err) {
        logger.error('WA_TEMPLATES GET', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ PUT /api/whatsapp-templates/:eventName â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/:eventName', authenticate, async (req, res) => {
    try {
        const { eventName } = req.params;
        const { templateText, isActive, timingWindowStart, timingWindowEnd, minGapHours } = req.body;

        if (!Object.keys(DEFAULT_TEMPLATES).includes(eventName)) {
            return res.status(400).json({ error: 'Invalid eventName' });
        }

        const { data: updated, error } = await supabase
            .from('whatsapp_templates')
            .upsert({ 
                merchant_id: req.user.id || req.user._id, 
                event_name: eventName,
                template_body: templateText,
                is_active: isActive,
                metadata: { timingWindowStart, timingWindowEnd, minGapHours }
            }, { onConflict: 'merchant_id,event_name' })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, template: updated });
    } catch (err) {
        logger.error('WA_TEMPLATES PUT', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/whatsapp-templates/optout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Webhook for when customer sends STOP
router.post('/optout', async (req, res) => {
    try {
        const { phone, sellerId } = req.body;
        if (!phone || !sellerId) return res.status(400).json({ error: 'phone and sellerId required' });
        const waAutomation = require('../services/whatsappAutomationService');
        await waAutomation.processOptOut(phone, sellerId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

