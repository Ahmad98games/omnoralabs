const { createModel } = require('../utils/modelFactory');

const recommendationSchema = {
  userId: { type: String, required: true, index: true },
  recommendationType: { type: String, enum: ['similar', 'frequently_bought', 'recently_viewed', 'trending', 'personalized'], required: true },
  productId: { type: String, required: true },
  relatedProductIds: [{ productId: String, score: Number }],
  reason: String
};

const recentlyViewedSchema = {
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
  timeSpent: Number
};

module.exports = {
  Recommendation: createModel('Recommendation', recommendationSchema),
  RecentlyViewed: createModel('RecentlyViewed', recentlyViewedSchema)
};
