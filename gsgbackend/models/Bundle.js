/**
 * Bundle Model
 * Smart product bundles with auto-generation and manual creation
 */

const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    shortDescription: String,

    // Products in Bundle
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    ],

    // Bundle Pricing
    originalPrice: {
      type: Number,
      required: true,
    },
    bundlePrice: {
      type: Number,
      required: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      required: true,
    },

    // Bundle Details
    bundleImage: {
      url: String,
      alt: String,
    },
    category: String,
    bundleType: {
      type: String,
      enum: ['auto_generated', 'manual', 'seasonal', 'promotional'],
      default: 'manual',
    },

    // Availability
    stock: {
      type: Number,
      default: 9999,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Visibility
    visibility: {
      type: String,
      enum: ['public', 'members_only', 'hidden'],
      default: 'public',
    },
    displayPriority: {
      type: Number,
      default: 0,
    },

    // Auto-Generation Rules (for auto_generated bundles)
    autoGenerationRules: {
      complementaryProductIds: [mongoose.Schema.Types.ObjectId],
      category: String,
      priceRange: {
        min: Number,
        max: Number,
      },
      skinType: String, // For beauty products
      occassion: String,
      generatedAt: Date,
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'seasonal'],
        default: 'quarterly',
      },
    },

    // Analytics
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      purchaseCount: {
        type: Number,
        default: 0,
      },
      revenue: {
        type: Number,
        default: 0,
      },
      conversionRate: {
        type: Number,
        default: 0,
      },
    },

    // Validity Period (for promotional bundles)
    validityPeriod: {
      startDate: Date,
      endDate: Date,
    },

    // Tags & Metadata
    tags: [String],
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],

    // Related Info
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bundleSchema.index({ isActive: 1, visibility: 1 });
bundleSchema.index({ bundleType: 1, createdAt: -1 });
bundleSchema.index({ 'validityPeriod.startDate': 1, 'validityPeriod.endDate': 1 });
bundleSchema.index({ category: 1 });

/**
 * BundleService
 * Handles bundle operations and recommendations
 */
class BundleService {
  /**
   * Create manual bundle
   */
  static async createBundle(bundleData, createdBy) {
    try {
      const productIds = bundleData.productIds;
      
      // Fetch products to calculate original price
      const Product = mongoose.model('Product');
      const products = await Product.find({ _id: { $in: productIds } });
      
      const originalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
      const bundlePrice = bundleData.bundlePrice || originalPrice * 0.85; // Default 15% discount
      const discountAmount = originalPrice - bundlePrice;
      const discountPercent = ((discountAmount / originalPrice) * 100).toFixed(2);

      const bundle = await mongoose.model('Bundle').create({
        ...bundleData,
        originalPrice,
        bundlePrice,
        discountAmount,
        discountPercent,
        createdBy,
        bundleType: 'manual',
      });

      return {
        success: true,
        bundle,
      };
    } catch (error) {
      console.error('Error creating bundle:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Auto-generate bundles based on rules
   * E.g., frequently bought together, complementary products
   */
  static async autoGenerateBundles() {
    try {
      const Order = mongoose.model('Order');
      const Product = mongoose.model('Product');

      // Find frequently bought together products
      const pipeline = [
        {
          $match: {
            'items.productId': { $exists: true },
            status: { $in: ['completed', 'delivered'] },
          },
        },
        {
          $unwind: '$items',
        },
        {
          $group: {
            _id: '$items.productId',
            purchaseCount: { $sum: 1 },
          },
        },
        {
          $sort: { purchaseCount: -1 },
        },
        {
          $limit: 100,
        },
      ];

      const topProducts = await Order.aggregate(pipeline);

      // Create bundles from top product combinations
      const createdBundles = [];
      for (let i = 0; i < topProducts.length - 1; i += 2) {
        const productIds = [topProducts[i]._id, topProducts[i + 1]._id];
        const products = await Product.find({ _id: { $in: productIds } });
        
        const originalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
        const bundlePrice = originalPrice * 0.85;

        const bundle = await mongoose.model('Bundle').create({
          name: `${products[0]?.name} + ${products[1]?.name} Bundle`,
          productIds,
          originalPrice,
          bundlePrice,
          discountAmount: originalPrice - bundlePrice,
          discountPercent: 15,
          bundleType: 'auto_generated',
          autoGenerationRules: {
            generatedAt: new Date(),
            frequency: 'quarterly',
          },
        });

        createdBundles.push(bundle);
      }

      return {
        success: true,
        bundlesCreated: createdBundles.length,
        bundles: createdBundles,
      };
    } catch (error) {
      console.error('Error auto-generating bundles:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get bundle recommendations for a product
   */
  static async getBundleRecommendations(productId, limit = 3) {
    try {
      const bundles = await mongoose
        .model('Bundle')
        .find({
          productIds: productId,
          isActive: true,
          visibility: 'public',
        })
        .limit(limit);

      return {
        success: true,
        bundles,
      };
    } catch (error) {
      console.error('Error getting bundle recommendations:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Track bundle view
   */
  static async trackBundleView(bundleId) {
    try {
      await mongoose.model('Bundle').findByIdAndUpdate(
        bundleId,
        { $inc: { 'analytics.views': 1 } },
        { new: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Error tracking bundle view:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track bundle purchase
   */
  static async trackBundlePurchase(bundleId, amount) {
    try {
      const bundle = await mongoose.model('Bundle').findByIdAndUpdate(
        bundleId,
        {
          $inc: {
            'analytics.purchaseCount': 1,
            'analytics.revenue': amount,
          },
        },
        { new: true }
      );

      // Calculate conversion rate
      if (bundle.analytics.views > 0) {
        bundle.analytics.conversionRate = (
          (bundle.analytics.purchaseCount / bundle.analytics.views) * 100
        ).toFixed(2);
        await bundle.save();
      }

      return { success: true, bundle };
    } catch (error) {
      console.error('Error tracking bundle purchase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get bundles by category
   */
  static async getBundlesByCategory(category, limit = 10) {
    try {
      const bundles = await mongoose
        .model('Bundle')
        .find({
          category,
          isActive: true,
          visibility: 'public',
        })
        .sort({ displayPriority: -1, 'analytics.purchaseCount': -1 })
        .limit(limit);

      return { success: true, bundles };
    } catch (error) {
      console.error('Error getting bundles by category:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get top performing bundles
   */
  static async getTopPerformingBundles(limit = 10) {
    try {
      const bundles = await mongoose
        .model('Bundle')
        .find({
          isActive: true,
          visibility: 'public',
        })
        .sort({ 'analytics.revenue': -1 })
        .limit(limit);

      return { success: true, bundles };
    } catch (error) {
      console.error('Error getting top bundles:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = mongoose.model('Bundle', bundleSchema);
module.exports.BundleService = BundleService;
