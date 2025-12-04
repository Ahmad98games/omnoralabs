/**
 * PHASE 3: MULTI-MODEL FILE
 * Admin & Operations Features
 * - RecentlyViewed
 * - AuditLog
 * - Export
 * - Backup
 * - CMSPage & BlogPost
 * - InventoryForecast
 * - TaxSetting
 * - Comparison
 * - ChatMessage
 * - ImageAsset
 * - HealthMetric
 * - OrderEdit
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================
// RECENTLY VIEWED MODEL
// ============================================

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true,
    },

    sessionId: {
      type: String,
      sparse: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    viewedAt: {
      type: Date,
      default: Date.now,
    },

    timeSpentSeconds: Number,

    device: String, // 'mobile', 'desktop', 'tablet'

    referredFrom: String, // 'search', 'recommendation', 'category', 'direct'

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index
recentlyViewedSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// AUDIT LOG MODEL
// ============================================

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    userEmail: String,

    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'approve',
        'reject',
        'publish',
        'export',
        'import',
        'login',
        'logout',
      ],
    },

    resourceType: {
      type: String,
      required: true,
      index: true,
      // 'product', 'order', 'user', 'settings', 'coupon', etc.
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    resourceName: String,

    // Old vs New Values
    changes: {
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      changedFields: [String],
    },

    // Request Details
    ipAddress: String,
    userAgent: String,
    method: String, // HTTP method
    endpoint: String,

    // Status
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
    },

    errorMessage: String,

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days retention
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// EXPORT MODEL
// ============================================

const exportSchema = new mongoose.Schema(
  {
    exportType: {
      type: String,
      enum: ['orders', 'customers', 'products', 'analytics', 'inventory'],
      required: true,
    },

    format: {
      type: String,
      enum: ['csv', 'xlsx', 'json'],
      default: 'csv',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Filter Parameters
    filters: {
      dateRange: {
        from: Date,
        to: Date,
      },
      status: String,
      category: String,
      minValue: Number,
      maxValue: Number,
    },

    // Job Status
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },

    // Result
    fileUrl: String,
    fileName: String,
    fileSize: Number,

    // Metadata
    recordCount: Number,
    errorMessage: String,

    // Expiry (links valid for 7 days)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL Index
exportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// BACKUP MODEL
// ============================================

const backupSchema = new mongoose.Schema(
  {
    backupId: {
      type: String,
      unique: true,
      required: true,
    },

    backupType: {
      type: String,
      enum: ['full', 'incremental', 'differential'],
      default: 'full',
    },

    // Target
    targetDatabase: String,
    targetCollections: [String],

    // Status
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'verified'],
      default: 'pending',
    },

    // Details
    size: Number, // in MB
    duration: Number, // in seconds
    recordCount: Number,

    // Storage
    storageLocation: String, // S3, GCS, local, etc.
    storageUrl: String,

    // Verification
    verified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: Date,

    // Restoration Info
    canRestore: {
      type: Boolean,
      default: true,
    },

    restoredAt: Date,
    restoredBy: mongoose.Schema.Types.ObjectId,

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    scheduledBackup: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      index: true,
    },

    notes: String,
  },
  { timestamps: true }
);

// ============================================
// CMS PAGE & BLOG POST MODELS
// ============================================

const cmsPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],

    content: {
      type: String,
      required: true,
    },

    blocks: [
      {
        type: {
          type: String,
          enum: ['text', 'image', 'video', 'slider', 'testimonial', 'product_grid'],
        },
        data: mongoose.Schema.Types.Mixed,
      },
    ],

    heroImage: {
      url: String,
      alt: String,
    },

    publishedAt: Date,

    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    excerpt: String,

    featuredImage: {
      url: String,
      alt: String,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tags: [String],
    category: String,

    publishedAt: Date,

    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
    },

    seo: {
      title: String,
      description: String,
      keywords: [String],
    },

    metrics: {
      views: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
      comments: {
        type: Number,
        default: 0,
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================
// INVENTORY FORECAST MODEL
// ============================================

const inventoryForecastSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // Prediction
    predictedQuantity: {
      type: Number,
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },

    // Method
    method: {
      type: String,
      enum: ['moving_average', 'exponential_smoothing', 'linear_regression', 'machine_learning'],
      default: 'moving_average',
    },

    // Based on
    period: {
      type: String,
      enum: ['30_days', '60_days', '90_days'],
      default: '30_days',
    },

    // Accuracy
    actualQuantity: Number,
    accuracy: Number, // Percentage

    // Recommendation
    recommendedReorder: Boolean,
    reorderQuantity: Number,

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ============================================
// TAX SETTING MODEL
// ============================================

const taxSettingSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      required: true,
      index: true,
    },

    province: String,
    city: {
      type: String,
      sparse: true,
    },

    // Tax Configuration
    taxRate: {
      type: Number,
      required: true,
      default: 17,
    }, // Percentage

    taxType: {
      type: String,
      enum: ['gst', 'pst', 'vat', 'sales_tax', 'none'],
      default: 'gst',
    },

    // Applicability
    applicableProductTypes: [String], // Specific product types taxed differently

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Effective Period
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },

    effectiveUntil: Date,

    // Notes
    notes: String,

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ============================================
// PRODUCT COMPARISON MODEL
// ============================================

const comparisonSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },

    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    // Shared Comparison
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index
comparisonSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// CHAT MESSAGE MODEL
// ============================================

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    senderType: {
      type: String,
      enum: ['customer', 'support', 'bot'],
      required: true,
    },

    senderName: String,

    message: {
      type: String,
      required: true,
    },

    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'quick_reply'],
      default: 'text',
    },

    attachment: {
      url: String,
      type: String,
      size: Number,
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    // Metadata
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    ipAddress: String,

    rating: {
      type: Number,
      min: 1,
      max: 5,
      sparse: true,
    },
  },
  { timestamps: true }
);

// ============================================
// IMAGE ASSET MODEL
// ============================================

const imageAssetSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    // Optimized Versions
    webpUrl: String,
    thumbnailUrl: String,

    variants: [
      {
        width: Number,
        height: Number,
        url: String,
        size: Number,
      },
    ],

    // Metadata
    originalSize: Number,
    optimizedSize: Number,
    compressionRatio: Number,

    // CDN
    cdnUrl: String,
    isCached: {
      type: Boolean,
      default: false,
    },

    // Usage
    usedBy: [
      {
        resourceType: String, // 'product', 'blog', 'page'
        resourceId: mongoose.Schema.Types.ObjectId,
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================
// SERVER HEALTH METRIC MODEL
// ============================================

const healthMetricSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // System Metrics
    cpuUsage: {
      type: Number,
      min: 0,
      max: 100,
    },

    memoryUsage: {
      type: Number,
      min: 0,
      max: 100,
    },

    diskUsage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Database Metrics
    dbConnections: Number,
    dbQueryTime: Number, // ms

    // Request Metrics
    requestCount: {
      type: Number,
      default: 0,
    },

    errorCount: {
      type: Number,
      default: 0,
    },

    avgResponseTime: Number, // ms

    // Uptime
    uptime: Number, // seconds

    // Alerts
    alertsTriggered: [
      {
        type: String,
        triggeredAt: Date,
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['healthy', 'warning', 'critical'],
      default: 'healthy',
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index
healthMetricSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// ORDER EDIT MODEL
// ============================================

const orderEditSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    editType: {
      type: String,
      enum: ['items', 'quantity', 'address', 'status'],
      required: true,
    },

    // Changes
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    reason: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'applied'],
      default: 'pending',
    },

    approvedBy: mongoose.Schema.Types.ObjectId,
    approvedAt: Date,

    appliedAt: Date,

    // Customer Notification
    customerNotified: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: Date,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ============================================
// MULTI-LANGUAGE MODEL
// ============================================

const translationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },

    language: {
      type: String,
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
    },

    namespace: String, // 'common', 'navigation', 'product', etc.

    isApproved: {
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

translationSchema.index({ key: 1, language: 1 }, { unique: true });

// ============================================
// MULTI-CURRENCY MODEL
// ============================================

const currencySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    symbol: {
      type: String,
      required: true,
    },

    name: String,

    exchangeRate: {
      type: Number,
      required: true,
      default: 1,
    },

    baseOn: {
      type: String,
      default: 'PKR',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ============================================
// EXPORTS
// ============================================

module.exports.RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);
module.exports.AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports.Export = mongoose.model('Export', exportSchema);
module.exports.Backup = mongoose.model('Backup', backupSchema);
module.exports.CMSPage = mongoose.model('CMSPage', cmsPageSchema);
module.exports.BlogPost = mongoose.model('BlogPost', blogPostSchema);
module.exports.InventoryForecast = mongoose.model('InventoryForecast', inventoryForecastSchema);
module.exports.TaxSetting = mongoose.model('TaxSetting', taxSettingSchema);
module.exports.Comparison = mongoose.model('Comparison', comparisonSchema);
module.exports.ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
module.exports.ImageAsset = mongoose.model('ImageAsset', imageAssetSchema);
module.exports.HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);
module.exports.OrderEdit = mongoose.model('OrderEdit', orderEditSchema);
module.exports.Translation = mongoose.model('Translation', translationSchema);
module.exports.Currency = mongoose.model('Currency', currencySchema);
