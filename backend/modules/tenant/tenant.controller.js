const tenantService = require('./tenant.service');
const logger = require('../../shared/services/logger');

/**
 * Tenant Controller
 */
class TenantController {
    // CMS Handlers
    async getPage(req, res, next) {
        try {
            const { slug } = req.params;
            const merchantId = req.tenantId || req.user?.id; // Support both public and private access
            const isPreview = req.query.preview === 'true';

            const ast = await tenantService.getPageAST(merchantId, slug, !isPreview);
            res.json({ success: true, ast });
        } catch (err) {
            next(err);
        }
    }

    async savePage(req, res, next) {
        try {
            const { slug } = req.params;
            const merchantId = req.user.id;
            const { manifest, publish } = req.body;

            const result = await tenantService.savePageAST(merchantId, slug, manifest, publish);
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    // Product Handlers
    async listProducts(req, res, next) {
        try {
            const merchantId = req.tenantId || req.user?.id;
            const products = await tenantService.getProducts(merchantId, req.query);
            res.json({ success: true, products });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TenantController();
