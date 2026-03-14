const express = require('express');
const router = express.Router();
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const { protect, seller } = require('../middleware/auth');
const logger = require('../services/logger');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @desc    Get all products for the authenticated seller
 * @route   GET /api/seller/inventory
 */
router.get('/inventory', protect, seller, async (req, res) => {
    try {
        const merchantId = req.user.id || req.user._id;
        if (!uuidRegex.test(merchantId)) {
            return res.json({ success: true, count: 0, data: [] });
        }
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('merchant_id', merchantId);

        if (error) throw error;

        res.json({ success: true, count: products.length, data: products });
    } catch (err) {
        logger.error('SELLER_INVENTORY_FETCH_ERROR', { error: err.message });
        res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
    }
});

/**
 * @desc    Create new product for seller
 * @route   POST /api/seller/inventory
 */
router.post('/inventory', protect, seller, async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .insert([{
                ...req.body,
                merchant_id: req.user.id || req.user._id
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        logger.error('SELLER_PRODUCT_CREATE_ERROR', { error: err.message });
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @desc    Update product (ownership check enforced by query)
 * @route   PUT /api/seller/inventory/:id
 */
router.put('/inventory/:id', protect, seller, async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('merchant_id', req.user.id || req.user._id)
            .select()
            .single();

        if (error || !product) {
            return res.status(404).json({ success: false, error: 'Product not found or unauthorized' });
        }

        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @desc    Delete product
 * @route   DELETE /api/seller/inventory/:id
 */
router.delete('/inventory/:id', protect, seller, async (req, res) => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id)
            .eq('merchant_id', req.user.id || req.user._id);

        if (error) {
            return res.status(404).json({ success: false, error: 'Product not found or unauthorized' });
        }

        res.json({ success: true, message: 'Product removed' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
