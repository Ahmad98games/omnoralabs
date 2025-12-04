/**
 * PHASE 1: MULTI-MODEL FILE
 * Combined models for:
 * - Vendor & VendorProduct (Multi-Vendor)
 * - ProductVariant (Variant Engine)
 * - FlashSale (Flash Sales)
 * - BackInStockAlert (Back-In-Stock)
 * - OrderTracking (Advanced Order Tracking)
 */

const mongoose = require('mongoose');

// ============================================
// VENDOR MODEL
// ============================================

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: String,
    website: String,

    // Business Info
    businessRegistration: String,
    taxId: String,
    category: String,

    // Commission & Payouts
    commissionPercent: {
      type: Number,
      default: 15,
      min: 0,
      max: 50,
    },
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'wallet', 'check'],
      default: 'bank_transfer',
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      bankCode: String,
    },

    // Storefront
    storeName: String,
    storeDescription: String,
    storeImage: String,
    storeSlug: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Status & Verification
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'pending',
    },
    verificationDocuments: [String],
    approvedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,

    // Analytics
    totalSales: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayouts: {
      type: Number,
      default: 0,
    },

    // Contact
    address: String,
    city: String,
    province: String,
    postalCode: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

vendorSchema.index({ status: 1, isActive: 1 });
vendorSchema.index({ storeSlug: 1 });

// ============================================
// VENDOR PRODUCT MODEL
// ============================================

const vendorProductSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    // Vendor-Specific Info
    vendorSku: {
      type: String,
      unique: true,
      sparse: true,
    },
    vendorPrice: {
      type: Number,
      required: true,
    },
    vendorCost: Number,

    // Stock (Vendor manages separately)
    vendorStock: {
      type: Number,
      default: 0,
    },

    // Commission for this product
    commissionPercent: Number, // Override vendor default

    // Status
    isListed: {
      type: Boolean,
      default: true,
    },

    // Metrics
    vendorSales: {
      type: Number,
      default: 0,
    },
    vendorRevenue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

vendorProductSchema.index({ vendorId: 1, productId: 1 }, { unique: true });

// ============================================
// PRODUCT VARIANT MODEL
// ============================================

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    // Variant Attributes
    color: String,
    size: String,
    weight: Number,
    material: String,
    capacity: String,

    // Pricing
    variantPrice: {
      type: Number,
      required: true,
    },
    variantCost: Number,

    // Stock
    stock: {
      type: Number,
      default: 0,
    },
    reserved: {
      type: Number,
      default: 0,
    },
    available: {
      type: Number,
      default: function() {
        return this.stock - this.reserved;
      },
    },

    // Vendor (if multi-vendor)
    vendorId: mongoose.Schema.Types.ObjectId,

    // Images (variant-specific)
    images: [
      {
        url: String,
        alt: String,
        isPrimary: Boolean,
      },
    ],

    // SKU
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    barcode: String,

    // Specifications
    specifications: {
      type: Map,
      of: String,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Tracking
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1, isActive: 1 });
productVariantSchema.index({ sku: 1 });
productVariantSchema.index({ barcode: 1 });

// ============================================
// FLASH SALE MODEL
// ============================================

const flashSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,

    // Products in Flash Sale
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        variantId: mongoose.Schema.Types.ObjectId,
        originalPrice: Number,
        discountedPrice: Number,
        discountPercent: Number,
        maxQuantity: Number,
        currentQuantity: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Timing
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    countdownMinutes: {
      type: Number,
      default: 60,
    },

    // Status
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended'],
      default: 'upcoming',
    },

    // Overall Settings
    isLimited: {
      type: Boolean,
      default: true,
    },
    totalDiscount: Number,

    // Analytics
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },

    // Visibility
    isVisible: {
      type: Boolean,
      default: true,
    },

    // Notifications sent
    notificationsSent: {
      startReminder: Boolean,
      liveAnnouncement: Boolean,
      endingReminder: Boolean,
    },

    createdBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

flashSaleSchema.index({ startTime: 1, endTime: 1 });
flashSaleSchema.index({ status: 1 });

// ============================================
// BACK-IN-STOCK ALERT MODEL
// ============================================

const backInStockAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: mongoose.Schema.Types.ObjectId,

    // Contact Methods
    email: {
      type: String,
      required: true,
    },
    smsNumber: String,
    enableSms: {
      type: Boolean,
      default: false,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,

    // Timestamp
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index - Auto-delete after 90 days
backInStockAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================
// ORDER TRACKING MODEL
// ============================================

const orderTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },

    // Timeline Events
    events: [
      {
        status: {
          type: String,
          enum: [
            'pending',
            'confirmed',
            'processing',
            'packed',
            'shipped',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'returned',
          ],
        },
        timestamp: {
          type: Date,
          required: true,
        },
        notes: String,
        location: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        updatedBy: String, // 'system', 'vendor', 'customer_service'
      },
    ],

    // Current Status
    currentStatus: String,
    lastUpdated: Date,

    // Estimated Delivery
    estimatedDeliveryDate: Date,
    estimatedDeliveryRange: String, // e.g., "Monday - Wednesday"

    // Shipping Details
    trackingNumber: String,
    courier: String,
    courierTrackingUrl: String,

    // Proof
    deliveryProof: {
      signature: String,
      photo: String,
      recipientName: String,
      deliveredAt: Date,
    },

    // Customer Notifications
    notificationsSent: [
      {
        type: String,
        sentAt: Date,
      },
    ],
  },
  { timestamps: true }
);

orderTrackingSchema.index({ currentStatus: 1 });
orderTrackingSchema.index({ estimatedDeliveryDate: 1 });

// ============================================
// SERVICE CLASSES
// ============================================

class VendorService {
  static async createVendor(vendorData) {
    try {
      const vendor = await mongoose.model('Vendor').create(vendorData);
      return { success: true, vendor };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getVendorStorefront(storeSlug) {
    try {
      const vendor = await mongoose.model('Vendor').findOne({
        storeSlug,
        status: 'approved',
      });
      if (!vendor) return { success: false, error: 'Vendor not found' };

      const products = await mongoose
        .model('VendorProduct')
        .find({ vendorId: vendor._id, isListed: true })
        .populate('productId')
        .limit(50);

      return {
        success: true,
        vendor,
        products,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

class ProductVariantService {
  static async getVariantsForProduct(productId) {
    try {
      const variants = await mongoose
        .model('ProductVariant')
        .find({ productId, isActive: true });
      return { success: true, variants };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateVariantStock(variantId, quantityChange) {
    try {
      const variant = await mongoose.model('ProductVariant').findByIdAndUpdate(
        variantId,
        {
          $inc: { stock: quantityChange },
        },
        { new: true }
      );
      return { success: true, variant };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

class FlashSaleService {
  static async getActiveFlashSales() {
    try {
      const now = new Date();
      const sales = await mongoose.model('FlashSale').find({
        startTime: { $lte: now },
        endTime: { $gte: now },
        isVisible: true,
        status: 'live',
      });
      return { success: true, sales };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async trackFlashSaleImpression(flashSaleId) {
    try {
      await mongoose.model('FlashSale').findByIdAndUpdate(
        flashSaleId,
        { $inc: { impressions: 1 } },
        { new: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

class OrderTrackingService {
  static async updateOrderStatus(orderId, status, notes, location) {
    try {
      const tracking = await mongoose.model('OrderTracking').findOneAndUpdate(
        { orderId },
        {
          $push: {
            events: {
              status,
              timestamp: new Date(),
              notes,
              location,
              updatedBy: 'system',
            },
          },
          currentStatus: status,
          lastUpdated: new Date(),
        },
        { new: true }
      );

      return { success: true, tracking };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getOrderTimeline(orderId) {
    try {
      const tracking = await mongoose.model('OrderTracking').findOne({ orderId });
      if (!tracking) return { success: false, error: 'Tracking not found' };
      return { success: true, events: tracking.events, currentStatus: tracking.currentStatus };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports.Vendor = mongoose.model('Vendor', vendorSchema);
module.exports.VendorProduct = mongoose.model('VendorProduct', vendorProductSchema);
module.exports.ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
module.exports.FlashSale = mongoose.model('FlashSale', flashSaleSchema);
module.exports.BackInStockAlert = mongoose.model('BackInStockAlert', backInStockAlertSchema);
module.exports.OrderTracking = mongoose.model('OrderTracking', orderTrackingSchema);

module.exports.VendorService = VendorService;
module.exports.ProductVariantService = ProductVariantService;
module.exports.FlashSaleService = FlashSaleService;
module.exports.OrderTrackingService = OrderTrackingService;
