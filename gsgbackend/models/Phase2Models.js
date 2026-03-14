/**
 * PHASE 2: MULTI-MODEL FILE
 * Customer Loyalty & Personalization Features
 * - CustomerSegmentation
 * - LoyaltyPoints
 * - ReferralProgram
 * - Warranty
 * - FraudDetection
 * - ShippingRate
 * - CustomerAddress
 * - GuestOrder
 * - AIProductDescription
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================
// CUSTOMER SEGMENTATION MODEL
// ============================================

const customerSegmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Segment Classification
    segments: {
      isNew: {
        type: Boolean,
        default: true,
      },
      isRepeat: {
        type: Boolean,
        default: false,
      },
      isVIP: {
        type: Boolean,
        default: false,
      },
      isHighValue: {
        type: Boolean,
        default: false,
      },
      isAtRisk: {
        type: Boolean,
        default: false,
      },
      isSleeping: {
        type: Boolean,
        default: false,
      },
    },

    // Metrics for Segmentation
    metrics: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      averageOrderValue: {
        type: Number,
        default: 0,
      },
      lastOrderDate: Date,
      daysInactive: {
        type: Number,
        default: 0,
      },
      repeatPurchaseRate: {
        type: Number,
        default: 0,
      },
      productViewsLastMonth: {
        type: Number,
        default: 0,
      },
      cartAbandonmentCount: {
        type: Number,
        default: 0,
      },
    },

    // Custom Attributes
    customAttributes: {
      preferredCategory: String,
      preferredBrand: String,
      averagePrice: Number,
      avgShippingMethod: String,
      preferredPaymentMethod: String,
    },

    // Engagement
    engagementLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'low',
    },

    // Churn Risk (0-100)
    churnRiskScore: {
      type: Number,
      default: 0,
    },

    // Lifetime Value
    predictedLTV: {
      type: Number,
      default: 0,
    },

    lastRecalculatedAt: Date,
  },
  { timestamps: true }
);

customerSegmentSchema.index({ segments: 1 });
customerSegmentSchema.index({ 'metrics.totalSpent': -1 });

// ============================================
// LOYALTY POINTS MODEL
// ============================================

const loyaltyAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Points Balance
    totalPoints: {
      type: Number,
      default: 0,
    },
    availablePoints: {
      type: Number,
      default: 0,
    },
    redeemedPoints: {
      type: Number,
      default: 0,
    },

    // Tier System
    currentTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    tierEarningsMultiplier: {
      type: Number,
      default: 1,
    },
    pointsUntilNextTier: {
      type: Number,
      default: 500,
    },

    // Tier Progression
    tierHistory: [
      {
        tier: String,
        achievedAt: Date,
        totalPointsAtTime: Number,
      },
    ],

    // Expires (Unused points after 12 months)
    pointsExpiryDate: Date,

    // Redemption History
    redemptionHistory: [
      {
        pointsRedeemed: Number,
        discountAmount: Number,
        orderId: mongoose.Schema.Types.ObjectId,
        redeemedAt: Date,
        expiresAt: Date,
      },
    ],

    // Notifications
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const pointsTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    points: {
      type: Number,
      required: true,
    },

    transactionType: {
      type: String,
      enum: ['purchase', 'review', 'referral', 'birthday', 'redemption', 'admin_adjustment'],
      required: true,
    },

    description: String,

    orderId: mongoose.Schema.Types.ObjectId,
    referencedTransaction: mongoose.Schema.Types.ObjectId,

    status: {
      type: String,
      enum: ['pending', 'completed', 'reversed'],
      default: 'pending',
    },

    expiresAt: Date,

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index - Auto-delete expired transactions
pointsTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// ============================================
// REFERRAL PROGRAM MODEL
// ============================================

const referralCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    code: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },

    // Discount Settings
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
    }, // 10 for 10%, or 500 for 500 PKR
    referrerReward: Number, // Amount referrer gets per successful referral
    refereeReward: Number, // Amount referee gets on first purchase

    // Usage Tracking
    referralCount: {
      type: Number,
      default: 0,
    },
    successfulReferrals: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Validity
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },

    // Shareable Link
    shareUrl: String,
  },
  { timestamps: true }
);

const referralTransactionSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    refereeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },

    refereeEmail: {
      type: String,
      sparse: true,
    },

    referralCode: String,

    orderId: mongoose.Schema.Types.ObjectId,

    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
    },

    commissionAmount: Number,
    commissionStatus: {
      type: String,
      enum: ['pending', 'processing', 'paid'],
      default: 'pending',
    },

    paidAt: Date,

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================
// WARRANTY MODEL
// ============================================

const warrantySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    planName: {
      type: String,
      required: true,
    },

    description: String,

    // Warranty Duration
    durationMonths: {
      type: Number,
      required: true,
    },

    // Price
    price: {
      type: Number,
      required: true,
    },

    // Coverage
    coverageDetails: {
      manufacturingDefects: Boolean,
      accidentalDamage: Boolean,
      waterDamage: Boolean,
      electricalIssues: Boolean,
      replacementCoverage: Boolean,
      limitedCoverage: String,
    },

    // Terms
    terms: String,
    excludions: [String],

    // Service
    serviceType: {
      type: String,
      enum: ['replacement', 'repair', 'both'],
      default: 'replacement',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const warrantyPurchaseSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    warrantyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warranty',
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    warrantyPrice: Number,

    purchasedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: Date,

    // Claims
    claims: [
      {
        claimNumber: String,
        description: String,
        status: {
          type: String,
          enum: ['submitted', 'approved', 'rejected', 'completed'],
          default: 'submitted',
        },
        submittedAt: Date,
        processedAt: Date,
        resolutionMethod: String, // 'replacement', 'repair', 'refund'
      },
    ],

    status: {
      type: String,
      enum: ['active', 'expired', 'claimed', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// ============================================
// FRAUD DETECTION MODEL
// ============================================

const fraudFlagSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },

    // Risk Assessment
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    // Flags
    flags: [
      {
        type: String,
        enum: [
          'high_value_order',
          'new_customer',
          'multiple_payment_failures',
          'unusual_shipping_address',
          'multiple_orders_same_ip',
          'excessive_discounts',
          'order_outside_normal_pattern',
          'high_risk_country',
          'unusual_device_fingerprint',
          'velocity_check_failed',
        ],
      },
    ],

    // Verification
    requiresVerification: {
      type: Boolean,
      default: false,
    },

    verificationMethod: String, // 'email', 'phone', 'address_verification'

    // Review
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'manual_intervention'],
      default: 'pending',
    },

    reviewedBy: mongoose.Schema.Types.ObjectId,
    reviewedAt: Date,

    notes: String,

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================
// SHIPPING RATE MODEL
// ============================================

const shippingRateSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      index: true,
    },

    province: String,
    zone: {
      type: String,
      enum: ['metro', 'tier1', 'tier2', 'tier3', 'remote'],
      default: 'tier2',
    },

    // Weight-based Pricing
    baseCost: {
      type: Number,
      required: true,
    },

    costPerKg: {
      type: Number,
      default: 10,
    },

    minCost: {
      type: Number,
      default: 100,
    },

    maxCost: {
      type: Number,
      default: 5000,
    },

    // Free Shipping Threshold
    freeShippingAbove: {
      type: Number,
      default: null,
    },

    // Express Shipping
    expressAvailable: {
      type: Boolean,
      default: true,
    },
    expressMultiplier: {
      type: Number,
      default: 1.5,
    },

    // Delivery Time
    estimatedDays: {
      type: Number,
      default: 3,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ============================================
// CUSTOMER ADDRESS MODEL
// ============================================

const customerAddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    label: {
      type: String,
      enum: ['home', 'office', 'other'],
      default: 'other',
    },

    customLabel: String,

    // Address Details
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: String,

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
      index: true,
    },

    province: {
      type: String,
      required: true,
    },

    postalCode: String,

    country: {
      type: String,
      default: 'Pakistan',
    },

    // Additional Info
    apartmentNumber: String,
    buildingName: String,
    landmarkNearby: String,

    coordinates: {
      latitude: Number,
      longitude: Number,
    },

    // Default
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

customerAddressSchema.index({ userId: 1, isDefault: 1 });

// ============================================
// GUEST ORDER MODEL
// ============================================

const guestOrderSchema = new mongoose.Schema(
  {
    guestEmail: {
      type: String,
      required: true,
      index: true,
    },

    // Order Data
    cartSnapshot: {
      items: Array,
      totals: Object,
    },

    orderData: {
      shippingAddress: Object,
      paymentMethod: String,
      status: String,
    },

    // Guest Access
    guestToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Conversion to Account
    convertedToUserId: mongoose.Schema.Types.ObjectId,
    convertedAt: Date,

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL Index
guestOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// AI PRODUCT DESCRIPTION MODEL
// ============================================

const aiProductDescriptionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },

    originalDescription: {
      type: String,
      required: true,
    },

    aiGeneratedDescriptions: [
      {
        text: String,
        tone: String, // 'professional', 'casual', 'luxury', 'technical'
        generatedAt: Date,
        model: String, // 'gpt-3.5', 'gpt-4', etc.
        tokensUsed: Number,
      },
    ],

    selectedDescription: {
      index: Number,
      text: String,
      selectedAt: Date,
      isActive: {
        type: Boolean,
        default: true,
      },
    },

    // SEO Optimization
    seoOptimized: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    // Analytics
    impressions: {
      type: Number,
      default: 0,
    },

    conversionRate: {
      type: Number,
      default: 0,
    },

    // Version Control
    versionHistory: [
      {
        description: String,
        changedAt: Date,
        changedBy: String,
      },
    ],

    lastUpdated: Date,
  },
  { timestamps: true }
);

// ============================================
// SERVICE CLASSES
// ============================================

class CustomerSegmentationService {
  static async recalculateSegments(userId) {
    try {
      const Order = mongoose.model('Order');
      const User = mongoose.model('User');

      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Fetch order history
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

      // Calculate segments
      const segments = {
        isNew: totalOrders === 0,
        isRepeat: totalOrders > 1,
        isVIP: totalSpent > 50000,
        isHighValue: totalSpent > 20000,
        isAtRisk: totalOrders > 0 && !lastOrderDate.within(30),
        isSleeping: totalOrders > 0 && !lastOrderDate.within(90),
      };

      const segmentDoc = await mongoose.model('CustomerSegment').findOneAndUpdate(
        { userId },
        {
          segments,
          metrics: {
            totalOrders,
            totalSpent,
            averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
            lastOrderDate,
          },
          lastRecalculatedAt: new Date(),
        },
        { new: true, upsert: true }
      );

      return { success: true, segment: segmentDoc };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports.CustomerSegment = mongoose.model('CustomerSegment', customerSegmentSchema);
module.exports.LoyaltyAccount = mongoose.model('LoyaltyAccount', loyaltyAccountSchema);
module.exports.PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);
module.exports.ReferralCode = mongoose.model('ReferralCode', referralCodeSchema);
module.exports.ReferralTransaction = mongoose.model('ReferralTransaction', referralTransactionSchema);
module.exports.Warranty = mongoose.model('Warranty', warrantySchema);
module.exports.WarrantyPurchase = mongoose.model('WarrantyPurchase', warrantyPurchaseSchema);
module.exports.FraudFlag = mongoose.model('FraudFlag', fraudFlagSchema);
module.exports.ShippingRate = mongoose.model('ShippingRate', shippingRateSchema);
module.exports.CustomerAddress = mongoose.model('CustomerAddress', customerAddressSchema);
module.exports.GuestOrder = mongoose.model('GuestOrder', guestOrderSchema);
module.exports.AIProductDescription = mongoose.model('AIProductDescription', aiProductDescriptionSchema);

module.exports.CustomerSegmentationService = CustomerSegmentationService;
