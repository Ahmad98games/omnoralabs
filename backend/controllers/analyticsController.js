const Event = require('../models/Event');

exports.track = async (req, res) => {
  try {
    const { type, path, sessionId, userId, referrer, userAgent, screen, payload } = req.body || {};
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }
    const event = new Event({
      type,
      path,
      sessionId,
      userId: userId || undefined,
      referrer,
      userAgent: userAgent || req.get('user-agent'),
      screen,
      payload,
      ip: req.ip
    });
    await event.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error tracking event:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const { limit = 100, type, sessionId } = req.query;
    const query = {};
    if (type) query.type = type;
    if (sessionId) query.sessionId = sessionId;
    const events = await Event.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

