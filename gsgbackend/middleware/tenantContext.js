const SiteContent = require('../models/SiteContent');
const logger = require('../services/logger');
const { tenantStorage } = require('../utils/tenantStorage');

/**
 * Middleware to identify the tenant based on hostname or headers.
 * Implements architectural "Edge Middleware" pattern.
 */
const tenantContext = async (req, res, next) => {
    try {
        const hostname = req.hostname;
        const tenantIdHeader = req.headers['x-tenant-id'];

        // 1. Resolve Slug from Hostname (Sub-domain Pattern: slug.platform.com)
        let slug = null;
        const hostParts = hostname.split('.');
        if (hostParts.length > 2 && !hostParts[0].includes('www') && hostParts[0] !== 'localhost') {
            slug = hostParts[0];
        }

        // 2. Resolve Slug from Request Path (Gateway Pattern) if not found in hostname
        if (!slug) {
            const pathParts = req.path.split('/');
            const storeIndex = pathParts.indexOf('store');
            if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
                slug = pathParts[storeIndex + 1];
            }
        }

        let tenantId = tenantIdHeader || 'default_tenant';

        // 3. Resolve TenantID from Slug (Strict Isolation)
        if (slug) {
            const content = await SiteContent.findOne({ tenant_slug: slug });
            if (content) {
                tenantId = content.tenant_id;
            } else {
                tenantId = `tenant_${slug}`; // Fallback for auto-provisioning
            }
        }

        req.tenantId = tenantId;
        req.tenantSlug = slug;

        // Force multi-tenant scoping via AsyncLocalStorage
        tenantStorage.run({ tenantId, slug }, () => {
            if (slug) {
                logger.info(`GATEWAY_ISOLATION: [${tenantId}] territory active for -> ${req.path}`);
            }
            next();
        });
    } catch (err) {
        logger.error('TENANT_GATEWAY_CRASH', { error: err.message });
        res.status(500).json({ success: false, error: 'Identity resolution failure' });
    }
};

module.exports = { tenantContext };
