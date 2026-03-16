// NO TOP LEVEL REQUIRES
// This ensures the function starts even if dependencies are missing/broken

let app;
let dbConnect;
let stateService;
let constants;

module.exports = async (req, res) => {
    // Helper to allow CORS for diagnostic messages
    const enableCors = () => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-Api-Version, Content-Type');
    };

    // 0. DIAGNOSTIC PING
    // Access /api/any-route?ping=1 to verify the function is actually running
    if (req.query && req.query.ping) {
        enableCors();
        return res.status(200).json({
            status: 'pong',
            env: {
                hasJwtSecret: !!process.env.JWT_SECRET,
                hasMongoUri: !!process.env.MONGODB_URI,
                nodeEnv: process.env.NODE_ENV
            }
        });
    }

    if (req.query && req.query.diag) {
        enableCors();
        try {
            const bootstrap = require('../gsgbackend/bootstrap');
            const { app: expressApp } = await bootstrap();
            const routes = expressApp._router.stack.map(r => {
                if (r.route) return `[${r.route.stack[0].method.toUpperCase()}] ${r.route.path}`;
                if (r.name === 'router') return `[MOUNT] ${r.regexp}`;
                return r.name;
            });
            return res.status(200).json({ routes, url: req.url });
        } catch (e) {
            return res.status(500).json({ error: 'DIAG_FAIL', message: e.message, stack: e.stack });
        }
    }

    try {
        // 1. HARDCODED FALLBACKS (The "Nuclear Option")
        // If Vercel Env Vars fail, we use these directly to ensure startup.
        if (!process.env.JWT_SECRET) {
            console.warn('WARN: Using Hardcoded JWT_SECRET');
            process.env.JWT_SECRET = 'sec_7ca0cbeaf57b99648e8e31286327af09e465aefd3d4405fe86626ca7ca9607b3';
        }

        // 2. Lazy Load Modules
        if (!stateService) {
            stateService = require('../gsgbackend/services/stateService');
            constants = require('../gsgbackend/services/stateService'); // Loads exports
        }

        if (!app) {
            const bootstrap = require('../gsgbackend/bootstrap');
            const { app: expressApp } = await bootstrap(); // Runs env & infra ready hooks
            app = expressApp;
        }

        if (req.url && req.url.split('?')[0] === '/api/cms/content') {
            enableCors(); // Enforce CORS for direct edge loads
            req.url = req.url.replace('/api/cms', ''); // Maps to '/content' for sub-router
            const cmsRoutes = require('../gsgbackend/routes/cmsRoutes');
            return cmsRoutes(req, res, (err) => {
                if (err) return res.status(500).json({ error: 'CMS_DIRECT_FAIL', message: err.message });
                return app(req, res);
            });
        }

        // 3. Forward to Express
        return app(req, res);

    } catch (e) {
        console.error('Server Initialization Crash:', e);
        // Enable CORS so the frontend can actually see the error
        enableCors();

        // Return simple JSON to avoid any formatting issues
        // Use .send() with stringified JSON to ensure Content-Type handling doesn't interfere
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).send(JSON.stringify({
            error: 'CRITICAL_INIT_FAILURE',
            message: e.message,
            stack: e.stack ? e.stack.split('\n')[0] : null, // First line of stack only
            tip: 'If you see this, the backend failed to start. Check Vercel Logs.'
        }, null, 2));
    }
};
