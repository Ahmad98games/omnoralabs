const { createModel } = require('../utils/modelFactory');

const schema = {
  type: { type: String, required: true },
  path: { type: String },
  sessionId: { type: String, index: true },
  userId: { type: String }, // Stored as string for LocalDB compatibility
  referrer: { type: String },
  userAgent: { type: String },
  screen: {
    width: Number,
    height: Number
  },
  payload: { type: Object },
  ip: { type: String }
};

module.exports = createModel('Event', schema);
