const checkoutService = require('./checkout.service');
const logger = require('../../shared/services/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Checkout Controller
 * profit.
 */
class CheckoutController {
    /**
     * POST /api/checkout/create-session
     */
    async createSession(req, res, next) {
        try {
            const merchantId = req.user.id;
            const result = await checkoutService.createSession(merchantId, req.body);
            res.json({ success: true, ...result });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/checkout/webhook
     */
    async handleWebhook(req, res, next) {
        let event;
        try {
            const sig = req.headers['stripe-signature'];
            event = stripe.webhooks.constructEvent(
                req.rawBody, 
                sig, 
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            logger.error('WEBHOOK_SIG_FAILED', { error: err.message });
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            await checkoutService.handleWebhook(event);
            res.json({ received: true });
        } catch (err) {
            logger.error('WEBHOOK_HANDLING_ERR', { error: err.message });
            res.status(500).json({ error: 'Internal processing failure' });
        }
    }
}

module.exports = new CheckoutController();
