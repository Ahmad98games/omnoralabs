const Event = require('../models/Event');
const logger = require('../services/logger');

/**
 * High-Performance Telemetry Ingestion:
 * Extracts tenant_id securely and offloads DB writes to a background process
 * to ensure <50ms response times for the frontend.
 */
exports.track = async (req, res) => {
  const startTime = Date.now();
  try {
    const { type, path, sessionId, userId, referrer, userAgent, screen, payload } = req.body || {};
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default_tenant';

    if (!type) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    // Capture telemetry data
    const eventData = {
      tenant_id: tenantId,
      type,
      path,
      sessionId,
      userId: userId || undefined,
      referrer: referrer || req.get('referrer'),
      userAgent: userAgent || req.get('user-agent'),
      screen,
      payload,
      ip: req.ip,
      capturedAt: new Date()
    };

    // Offload write to background: Non-blocking
    setImmediate(async () => {
      try {
        const event = new Event(eventData);
        await event.save();
      } catch (err) {
        logger.error('Background Telemetry Write Failed', { error: err.message, tenantId });
      }
    });

    const duration = Date.now() - startTime;
    logger.debug(`Telemetry ingested in ${duration}ms`, { type, tenantId });

    // Immediate response to client (<50ms budget)
    res.json({ success: true, latency: `${duration}ms` });
  } catch (err) {
    logger.error('CRITICAL: Telemetry Ingestion Error', { error: err.message });
    res.status(500).json({ error: 'Tracking failed', message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { limit = 100, type, sessionId } = req.query;
    const query = { tenant_id: req.tenantId || 'default_tenant' };
    if (type) query.type = type;
    if (sessionId) query.sessionId = sessionId;
    const events = await Event.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

