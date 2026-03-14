const express = require('express');
const router = express.Router();
const tenantController = require('./tenant.controller');
const authGuard = require('../../shared/middleware/authGuard');

/**
 * Tenant Domain Routes
 * Mounted at /api/tenant
 */

// Public Storefront Hydration (Internal tenantContext provides req.tenantId)
router.get('/pages/:slug', tenantController.getPage);
router.get('/products', tenantController.listProducts);

// Protected Merchant Routes
router.post('/pages/:slug', authGuard, tenantController.savePage);

module.exports = router;
