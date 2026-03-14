// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const { protect: authenticate } = require('../middleware/auth');
const logger = require('../services/logger');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// â”€â”€ GET /api/payment-methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', authenticate, async (req, res) => {
    try {
        const merchant_id = req.user.id || req.user._id;
        if (!uuidRegex.test(merchant_id)) {
            return res.status(403).json({ error: 'Merchant Identity Required' });
        }
        const { data: merchant, error } = await supabase
            .from('merchants')
            .select('metadata')
            .eq('id', merchant_id)
            .single();

        if (error) throw error;
        
        const config = merchant.metadata?.payment_config || {
            methods: [],
            bankDetails: {},
            easypaisaNumber: '',
            jazzcashNumber: '',
            codFee: 0,
            bankTransferInstructions: ''
        };

        res.json(config);
    } catch (err) {
        logger.error('PAYMENT_METHODS GET', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ PUT /api/payment-methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/', authenticate, async (req, res) => {
    try {
        const merchant_id = req.user.id || req.user._id;
        const { methods, bankDetails, easypaisaNumber, jazzcashNumber, codFee, bankTransferInstructions } = req.body;

        const { data: merchant, error: fetchError } = await supabase
            .from('merchants')
            .select('metadata')
            .eq('id', merchant_id)
            .single();

        if (fetchError) throw fetchError;

        const updatedMetadata = {
            ...merchant.metadata,
            payment_config: { methods, bankDetails, easypaisaNumber, jazzcashNumber, codFee, bankTransferInstructions }
        };

        const { data: updated, error: updateError } = await supabase
            .from('merchants')
            .update({ metadata: updatedMetadata })
            .eq('id', merchant_id)
            .select()
            .single();

        if (updateError) throw updateError;
        res.json({ success: true, config: updated.metadata.payment_config });
    } catch (err) {
        logger.error('PAYMENT_METHODS PUT', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET /api/payment-methods/pending â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Orders pending manual payment verification
router.get('/pending', authenticate, async (req, res) => {
    try {
        const merchant_id = req.user.id || req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const { data: orders, error, count } = await supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('merchant_id', merchant_id)
            .in('payment_method', ['bank_transfer', 'easypaisa', 'jazzcash'])
            .in('financial_status', ['pending', 'receipt_uploaded']) // map verificationStatus to financial_status
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;
        res.json({ orders, total: count, page, limit });
    } catch (err) {
        logger.error('PAYMENT_METHODS /pending', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST /api/payment-methods/verify/:orderId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Seller approves or rejects a manual payment
router.post('/verify/:orderId', authenticate, async (req, res) => {
    try {
        const { decision, note } = req.body; // decision: 'approved' | 'rejected'
        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
        }

        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', req.params.orderId)
            .single();

        if (fetchError || !order) return res.status(404).json({ error: 'Order not found' });

        const newFinancialStatus = decision === 'approved' ? 'paid' : 'failed';
        const newFulfillmentStatus = decision === 'approved' ? 'processing' : 'cancelled';

        const auditEntry = {
            statusChange: `Payment ${decision}`,
            actorName: req.user.name || 'Seller',
            actorId: req.user.id,
            note: note || '',
            timestamp: new Date(),
        };

        const { error: updateError } = await supabase
            .from('orders')
            .update({
                financial_status: newFinancialStatus,
                fulfillment_status: newFulfillmentStatus,
                metadata: { 
                    ...(order.metadata || {}), 
                    auditTrail: [...(order.metadata?.auditTrail || []), auditEntry] 
                }
            })
            .eq('id', req.params.orderId);

        if (updateError) throw updateError;

        res.json({ success: true, decision });
    } catch (err) {
        logger.error('PAYMENT_METHODS /verify', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

