const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  path: { type: String },
  sessionId: { type: String, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referrer: { type: String },
  userAgent: { type: String },
  screen: {
    width: Number,
    height: Number
  },
  payload: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);

