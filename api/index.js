const app = require('../backend/server');
const dbConnect = require('../backend/lib/dbConnect');

module.exports = async (req, res) => {
    // 1. Handle DB Connection (Cached)
    try {
        await dbConnect();
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
