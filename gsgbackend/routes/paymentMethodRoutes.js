const express = require('express');
const router = express.Router();
const { protect: authenticate } = require('../middleware/auth');
const logger = require('../services/logger');

const getModels = () => ({
    PaymentMethod: require('../models/PaymentMethod'),
    Order: require('../models/Order'),
});

// â”€â”€ GET /api/payment-methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', authenticate, async (req, res) => {
    try {
        const { PaymentMethod } = getModels();
        const sellerId = req.user.id;
        let config = await PaymentMethod.findOne({ sellerId });
        if (!config) {
            config = await PaymentMethod.create({ sellerId });
        }
        res.json(config);
    } catch (err) {
        logger.error('PAYMENT_METHODS GET', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ PUT /api/payment-methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/', authenticate, async (req, res) => {
    try {
        const { PaymentMethod } = getModels();
        const sellerId = req.user.id;
        const { methods, bankDetails, easypaisaNumber, jazzcashNumber, codFee, bankTransferInstructions } = req.body;

        const updated = await PaymentMethod.findOneAndUpdate(
            { sellerId },
            { $set: { methods, bankDetails, easypaisaNumber, jazzcashNumber, codFee, bankTransferInstructions } },
            { upsert: true, new: true }
        );
        res.json({ success: true, config: updated });
    } catch (err) {
        logger.error('PAYMENT_METHODS PUT', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET /api/payment-methods/pending â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Orders pending manual payment verification
router.get('/pending', authenticate, async (req, res) => {
    try {
        const { Order } = getModels();
        const sellerId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const orders = await Order.find({
            sellerId,
            paymentMethod: { $in: ['bank_transfer', 'easypaisa', 'jazzcash'] },
            verificationStatus: { $in: ['unverified', 'receipt_uploaded'] }
        });

        // Client-side pagination (LocalDB doesn't support skip/limit natively)
        const paginated = orders.slice((page - 1) * limit, page * limit);
        res.json({ orders: paginated, total: orders.length, page, limit });
    } catch (err) {
        logger.error('PAYMENT_METHODS /pending', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/payment-methods/verify/:orderId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Seller approves or rejects a manual payment
router.post('/verify/:orderId', authenticate, async (req, res) => {
    try {
        const { Order } = getModels();
        const { decision, note } = req.body; // decision: 'approved' | 'rejected'
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const newPaymentStatus = decision === 'approved' ? 'verified' : 'rejected';
        const newOrderStatus = decision === 'approved' ? 'processing' : 'rejected';
        const newVerifyStatus = decision === 'approved' ? 'approved' : 'rejected';

        const auditEntry = {
            statusChange: `Payment ${decision}`,
            actorName: req.user.name || 'Seller',
            actorId: req.user.id,
            note: note || '',
            timestamp: new Date(),
        };

        await Order.findByIdAndUpdate(req.params.orderId, {
            $set: {
                paymentStatus: newPaymentStatus,
                status: newOrderStatus,
                verificationStatus: newVerifyStatus,
            },
            $push: { auditTrail: auditEntry }
        });

        res.json({ success: true, decision });
    } catch (err) {
        logger.error('PAYMENT_METHODS /verify', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

