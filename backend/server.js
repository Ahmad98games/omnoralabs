const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' })); // Increased for complex components

const { tenantContext } = require('./shared/middleware/tenantContext');
const analyticsController = require('./controllers/analyticsController');

app.use(tenantContext);

// 🟢 CORE OMNORA ROUTES (Migrated)
try {
    app.use('/api/cms', require('../gsgbackend/routes/cmsRoutes'));
    app.use('/api/auth', require('../gsgbackend/routes/authRoutes'));
    app.use('/api/products', require('../gsgbackend/routes/productRoutes'));
    app.use('/api/orders', require('../gsgbackend/routes/orderRoutes'));
    app.use('/api/users', require('../gsgbackend/routes/userRoutes'));
    console.log('✅ Omni-Route Gateway: Online');
} catch (err) {
    console.error('❌ Failed to load Core Routes:', err.message);
}

// 🟡 ANALYTICS & HUB BYPASS
app.post('/api/track', analyticsController.track);
app.get('/api/cms/performance-hub', (req, res) => res.json({ success: true, stats: { status: 'Optimized' } }));

// 🚀 START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n=========================================`);
    console.log(`🚀 OMNORA IMPERIAL ENGINE: RESTORED`);
    console.log(`🌐 Gateway: http://127.0.0.1:${PORT}`);
    console.log(`=========================================\n`);
});