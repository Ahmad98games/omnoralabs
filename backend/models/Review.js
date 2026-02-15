const { createModel } = require('../utils/modelFactory');

const schema = {
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: String,
  userEmail: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  text: { type: String, required: true, maxlength: 5000 },
  photos: [{ url: String, uploadedAt: Date }],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
};

module.exports = {
  Review: createModel('Review', schema)
};
