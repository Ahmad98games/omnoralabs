const express = require('express');
const router = express.Router();
// [Mongoose Removed] const Product = require('../models/Product');
const { protect, seller } = require('../middleware/auth');
const logger = require('../services/logger');

/**
 * @desc    Get all products for the authenticated seller
 * @route   GET /api/seller/inventory
 */
router.get('/inventory', protect, seller, async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id });
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
        const productData = {
            ...req.body,
            seller: req.user._id
        };
        const product = await Product.create(productData);
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
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, seller: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
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
        const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found or unauthorized' });
        }

        res.json({ success: true, message: 'Product removed' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
