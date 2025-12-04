const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime()
    });
});

module.exports = router;
