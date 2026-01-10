const app = require('../backend/server');
const dbConnect = require('../backend/lib/dbConnect');
const stateService = require('../backend/services/stateService');
const { LIFECYCLE, INFRA } = require('../backend/services/stateService');

module.exports = async (req, res) => {
    // 1. Handle DB Connection (Cached)
    try {
        await dbConnect();
        // Manually update state for Gatekeeper since bootstrap.js is skipped
        stateService.setInfraStatus(INFRA.DB, true);
        stateService.setLifecycle(LIFECYCLE.READY);
    } catch (e) {
        console.error('Database connection failed in serverless function:', e);
        return res.status(500).json({
            error: `Database connection failed: ${e.message}`,
            stack: e.stack
        });
    }

    // 2. Forward request to Express
    // Vercel's req/res are compatible with Express
    app(req, res);
};
