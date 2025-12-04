/**
 * Smart Product Recommendation System
 * Rule-based engine for:
 * - Similar Products (by category, tags, price range)
 * - Frequently Bought Together
 * - Recently Viewed Products
 */

const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  recommendationType: {
    type: String,
    enum: ['similar', 'frequently_bought', 'recently_viewed', 'trending', 'personalized'],
    required: true
  },
  productId: {
    type: Number,
    required: true
  },
  relatedProductIds: [{
    productId: Number,
    score: Number // Higher score = better match
  }],
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  reason: String, // "You bought X, customers also bought Y"
  generatedAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days
  }
});

const RecentlyViewedSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: Number,
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: Number, // seconds
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // Auto-delete after 90 days
  }
});

const BoughtTogetherSchema = new mongoose.Schema({
  product1Id: {
    type: Number,
    required: true,
    index: true
  },
  product2Id: {
    type: Number,
    required: true,
    index: true
  },
  frequency: {
    type: Number,
    default: 1 // Number of times bought together
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = {
  Recommendation: mongoose.model('Recommendation', RecommendationSchema),
  RecentlyViewed: mongoose.model('RecentlyViewed', RecentlyViewedSchema),
  BoughtTogether: mongoose.model('BoughtTogether', BoughtTogetherSchema)
};
