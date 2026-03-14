const analyticsService = require('./analytics.service');
const logger = require('../../shared/services/logger');

/**
 * Analytics Controller
 */
class AnalyticsController {
    /**
     * GET /api/analytics/store-metrics
     */
    async getMetrics(req, res, next) {
        try {
            const merchantId = req.user.id;
            const stats = await analyticsService.getStoreStats(merchantId, req.query.days || 30);
            res.json({ success: true, stats });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/analytics/track
     */
    async track(req, res, next) {
        try {
            const merchantId = req.tenantId || req.user?.id;
            await analyticsService.trackEvent(merchantId, req.body);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AnalyticsController();
