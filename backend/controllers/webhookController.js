const logger = require('../services/logger');
const MessageLog = require('../models/MessageLog');
const crypto = require('crypto');

/**
 * Verify WhatsApp webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(req) {
    const signature = req.headers['x-hub-signature-256'];

    if (!signature) {
        logger.warn('Webhook signature missing', { ip: req.ip });
        return false;
    }

    if (!process.env.WHATSAPP_APP_SECRET) {
        logger.error('WHATSAPP_APP_SECRET not configured');
        return false;
    }

    try {
        // Reconstruct raw body for signature verification
        const payload = JSON.stringify(req.body);
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
            .update(payload)
            .digest('hex');

        // Timing-safe comparison
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            logger.warn('Invalid webhook signature', {
                ip: req.ip,
                receivedSignature: signature.substring(0, 20) + '...',
                expectedSignature: expectedSignature.substring(0, 20) + '...'
            });
        }

        return isValid;
    } catch (error) {
        logger.error('Signature verification error', { error: error.message });
        return false;
    }
}

/**
 * @desc    Verify Webhook (GET request from WhatsApp)
 * @route   GET /api/webhook
 * @access  Public
 */
exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
            logger.info('Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            logger.warn('Webhook verification failed - invalid token');
            res.sendStatus(403);
        }
    } else {
        logger.warn('Webhook verification failed - missing parameters');
        res.sendStatus(403);
    }
};

/**
 * @desc    Handle Webhook Events (POST request from WhatsApp)
 * @route   POST /api/webhook
 * @access  Public (with signature verification)
 */
exports.handleWebhook = async (req, res) => {
    // SECURITY: Verify webhook signature
    if (!verifyWebhookSignature(req)) {
        logger.error('Webhook signature verification failed', { ip: req.ip });
        return res.status(403).json({ error: 'Invalid signature' });
    }

    const body = req.body;

    // Check if this is an event from a WhatsApp Business Account
    if (body.object === 'whatsapp_business_account') {
        // Iterate over each entry - there may be multiple if batched
        for (const entry of body.entry) {
            const changes = entry.changes;

            for (const change of changes) {
                // Handle incoming messages
                if (change.value.messages) {
                    const messages = change.value.messages;

                    for (const message of messages) {
                        logger.info('Received WhatsApp message', {
                            from: message.from,
                            id: message.id,
                            type: message.type
                        });

                        // Persist to database
                        try {
                            await MessageLog.create({
                                messageId: message.id,
                                recipientPhone: message.from,
                                type: message.type || 'unknown',
                                direction: 'inbound',
                                status: 'received',
                                content: message
                            });
                        } catch (dbError) {
                            logger.error('Failed to persist inbound message', {
                                error: dbError.message
                            });
                        }
                    }
                }

                // Handle status updates (sent, delivered, read, failed)
                if (change.value.statuses) {
                    const statuses = change.value.statuses;

                    for (const status of statuses) {
                        logger.info('WhatsApp message status update', {
                            id: status.id,
                            status: status.status,
                            recipient_id: status.recipient_id
                        });

                        // Update message log in database
                        try {
                            await MessageLog.findOneAndUpdate(
                                { messageId: status.id },
                                {
                                    status: status.status,
                                    error: status.errors ? JSON.stringify(status.errors) : undefined
                                },
                                { upsert: true }
                            );
                        } catch (dbError) {
                            logger.error('Failed to update message status', {
                                error: dbError.message
                            });
                        }
                    }
                }
            }
        }

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a WhatsApp API
        logger.warn('Webhook received non-WhatsApp event', { object: body.object });
        res.sendStatus(404);
    }
};
