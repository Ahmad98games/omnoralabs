const { supabase } = require('../shared/lib/supabaseClient');
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Capture telemetry data
    const eventData = {
      merchant_id: tenantId,
      event_type: type === 'page_view' ? 'page_view' : 'search', // Simplified mapping to schema
      page_url: path,
      session_id: sessionId,
      customer_id: uuidRegex.test(userId) ? userId : null,
      referrer: referrer || req.get('referrer'),
      metadata: {
        ...(payload || {}),
        userAgent: userAgent || req.get('user-agent'),
        screen,
        ip: req.ip
      }
    };

    // Offload write to background: Non-blocking
    if (uuidRegex.test(tenantId)) {
      setImmediate(async () => {
        try {
          const { error } = await supabase
            .from('interaction_logs')
            .insert([eventData]);
          
          if (error) throw error;
        } catch (err) {
          logger.error('Background Telemetry Write Failed', { error: err.message, tenantId });
        }
      });
    } else {
      logger.debug(`TELEMETRY_PERSIST_SKIP: [${tenantId}] is not a valid UUID.`);
    }

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
    const tenantId = req.tenantId || 'default_tenant';
    
    if (!uuidRegex.test(tenantId)) {
        return res.json({ success: true, events: [] });
    }

    let query = supabase
      .from('interaction_logs')
      .select('*')
      .eq('merchant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (type) query = query.eq('event_type', type);
    if (sessionId) query = query.eq('session_id', sessionId);

    const { data: events, error } = await query;
    if (error) throw error;

    res.json({ success: true, events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

