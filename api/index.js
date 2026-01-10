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

    try {
        // 1. HARDCODED FALLBACKS (The "Nuclear Option")
        // If Vercel Env Vars fail, we use these directly to ensure startup.
        if (!process.env.JWT_SECRET) {
            console.warn('WARN: Using Hardcoded JWT_SECRET');
            process.env.JWT_SECRET = 'sec_7ca0cbeaf57b99648e8e31286327af09e465aefd3d4405fe86626ca7ca9607b3';
        }
        if (!process.env.MONGODB_URI) {
            console.warn('WARN: Using Hardcoded MONGODB_URI');
            process.env.MONGODB_URI = 'mongodb+srv://mahboobrubani2384_db_user:98158302384@cluster0.mnp2buu.mongodb.net/?appName=Cluster0';
        }

        // 2. Lazy Load Modules
        if (!stateService) {
            stateService = require('../backend/services/stateService');
            constants = require('../backend/services/stateService'); // Loads exports
        }
        if (!dbConnect) dbConnect = require('../backend/lib/dbConnect');
        if (!app) app = require('../backend/server');

        // 3. Handle DB Connection
        await dbConnect();

        // 4. Update Gatekeeper State
        // Use constants if destructured, or access directly
        const INFRA = constants.INFRA || { DB: 'db' };
        const LIFECYCLE = constants.LIFECYCLE || { READY: 'READY' };

        stateService.setInfraStatus(INFRA.DB, true);
        stateService.setLifecycle(LIFECYCLE.READY);

        // 5. Forward to Express
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
