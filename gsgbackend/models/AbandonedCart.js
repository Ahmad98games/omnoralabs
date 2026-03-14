/**
 * AbandonedCart Model & Service
 * Tracks abandoned carts and recovery email campaigns
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const abandonedCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    guestEmail: {
      type: String,
      sparse: true,
    },

    // Cart Content
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        variantId: mongoose.Schema.Types.ObjectId,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        discount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Cart Totals
    cartTotals: {
      subtotal: {
        type: Number,
        required: true,
      },
      discountApplied: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      shippingCost: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
      couponCode: String,
    },

    // Recovery Information
    recoveryToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Email Recovery Attempts
    emailRecoveryAttempts: [
      {
        attemptNumber: Number,
        sentAt: Date,
        emailTemplate: String, // 'first', 'second', 'final'
        opened: {
          type: Boolean,
          default: false,
        },
        openedAt: Date,
        clicked: {
          type: Boolean,
          default: false,
        },
        clickedAt: Date,
        recovered: {
          type: Boolean,
          default: false,
        },
        recoveryDiscount: {
          type: Number,
          default: 0,
        },
        recoveryDiscountCode: String,
      },
    ],

    // Recovery Status
    status: {
      type: String,
      enum: ['active', 'recovered', 'expired', 'ignored'],
      default: 'active',
    },

    recoveryDate: Date,
    recoveryOrderId: mongoose.Schema.Types.ObjectId,

    // Metadata
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    referrer: String,

    // Tracking
    abandonedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    nextRecoveryEmailAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index - Auto-delete after 30 days
abandonedCartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes
abandonedCartSchema.index({ userId: 1, status: 1 });
abandonedCartSchema.index({ guestEmail: 1 });
abandonedCartSchema.index({ recoveryToken: 1 });
abandonedCartSchema.index({ abandonedAt: -1 });

/**
 * AbandonedCartService
 * Handles cart abandonment tracking and recovery
 */
class AbandonedCartService {
  /**
   * Mark cart as abandoned
   */
  static async trackAbandonedCart(userId, guestEmail, cartItems, cartTotals, sessionData) {
    try {
      const recoveryToken = crypto.randomBytes(32).toString('hex');

      const abandonedCart = await mongoose.model('AbandonedCart').create({
        userId: userId || null,
        guestEmail: guestEmail || null,
        cartItems,
        cartTotals,
        recoveryToken,
        sessionId: sessionData?.sessionId,
        ipAddress: sessionData?.ipAddress,
        userAgent: sessionData?.userAgent,
        referrer: sessionData?.referrer,
      });

      return {
        success: true,
        cartId: abandonedCart._id,
        recoveryToken,
      };
    } catch (error) {
      console.error('Error tracking abandoned cart:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send first recovery email (1 hour after abandonment)
   */
  static async sendFirstRecoveryEmail(cartId, emailAddress) {
    try {
      const cart = await mongoose.model('AbandonedCart').findById(cartId);
      if (!cart) {
        return { success: false, error: 'Cart not found' };
      }

      // Generate 10% discount code for recovery
      const discountCode = `RECOVER10-${Date.now()}`;
      const discountPercent = 10;

      const emailAttempt = {
        attemptNumber: 1,
        sentAt: new Date(),
        emailTemplate: 'first',
        recoveryDiscount: discountPercent,
        recoveryDiscountCode: discountCode,
      };

      cart.emailRecoveryAttempts.push(emailAttempt);
      cart.nextRecoveryEmailAt = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23 hours later
      await cart.save();

      // TODO: Send email with emailService
      return {
        success: true,
        recoveryToken: cart.recoveryToken,
        discountCode,
        message: 'First recovery email queued',
      };
    } catch (error) {
      console.error('Error sending recovery email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send second recovery email (24 hours after abandonment)
   */
  static async sendSecondRecoveryEmail(cartId) {
    try {
      const cart = await mongoose.model('AbandonedCart').findById(cartId);
      if (!cart) {
        return { success: false, error: 'Cart not found' };
      }

      const discountCode = `RECOVER15-${Date.now()}`;
      const discountPercent = 15;

      const emailAttempt = {
        attemptNumber: 2,
        sentAt: new Date(),
        emailTemplate: 'second',
        recoveryDiscount: discountPercent,
        recoveryDiscountCode: discountCode,
      };

      cart.emailRecoveryAttempts.push(emailAttempt);
      cart.nextRecoveryEmailAt = new Date(Date.now() + 47 * 60 * 60 * 1000); // 47 hours later
      await cart.save();

      return {
        success: true,
        discountCode,
        message: 'Second recovery email queued',
      };
    } catch (error) {
      console.error('Error sending second recovery email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send final recovery email (48 hours after abandonment)
   */
  static async sendFinalRecoveryEmail(cartId) {
    try {
      const cart = await mongoose.model('AbandonedCart').findById(cartId);
      if (!cart) {
        return { success: false, error: 'Cart not found' };
      }

      const discountCode = `FINAL20-${Date.now()}`;
      const discountPercent = 20;

      const emailAttempt = {
        attemptNumber: 3,
        sentAt: new Date(),
        emailTemplate: 'final',
        recoveryDiscount: discountPercent,
        recoveryDiscountCode: discountCode,
      };

      cart.emailRecoveryAttempts.push(emailAttempt);
      await cart.save();

      return {
        success: true,
        discountCode,
        message: 'Final recovery email queued',
      };
    } catch (error) {
      console.error('Error sending final recovery email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Recover cart from abandoned state
   */
  static async recoverCart(recoveryToken) {
    try {
      const cart = await mongoose.model('AbandonedCart').findOne({
        recoveryToken,
        status: 'active',
      });

      if (!cart) {
        return { success: false, error: 'Invalid or expired recovery token' };
      }

      return {
        success: true,
        cartData: {
          items: cart.cartItems,
          totals: cart.cartTotals,
          recoveryDiscount: cart.emailRecoveryAttempts[cart.emailRecoveryAttempts.length - 1]?.recoveryDiscount || 0,
          discountCode: cart.emailRecoveryAttempts[cart.emailRecoveryAttempts.length - 1]?.recoveryDiscountCode,
        },
      };
    } catch (error) {
      console.error('Error recovering cart:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark cart as recovered after purchase
   */
  static async markAsRecovered(cartId, orderId) {
    try {
      const cart = await mongoose.model('AbandonedCart').findByIdAndUpdate(
        cartId,
        {
          status: 'recovered',
          recoveryDate: new Date(),
          recoveryOrderId: orderId,
        },
        { new: true }
      );

      return { success: true, cart };
    } catch (error) {
      console.error('Error marking cart as recovered:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get abandoned carts for admin (for manual recovery)
   */
  static async getAbandonedCartsForAdmin(filters = {}) {
    try {
      const query = {
        status: 'active',
        abandonedAt: {
          $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      };

      if (filters.minValue) {
        query['cartTotals.total'] = { $gte: filters.minValue };
      }

      if (filters.recoveryAttempts) {
        query['emailRecoveryAttempts'] = { $size: filters.recoveryAttempts };
      }

      const carts = await mongoose
        .model('AbandonedCart')
        .find(query)
        .sort({ 'cartTotals.total': -1 })
        .limit(50);

      const statistics = {
        totalAbandoned: carts.length,
        totalValue: carts.reduce((sum, cart) => sum + cart.cartTotals.total, 0),
        averageValue: carts.length > 0 ? carts.reduce((sum, cart) => sum + cart.cartTotals.total, 0) / carts.length : 0,
      };

      return {
        success: true,
        carts,
        statistics,
      };
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk recovery emails (admin manual trigger)
   */
  static async sendBulkRecoveryEmails(cartIds, discountPercent) {
    try {
      const carts = await mongoose.model('AbandonedCart').updateMany(
        { _id: { $in: cartIds } },
        {
          $push: {
            emailRecoveryAttempts: {
              attemptNumber: new Date().getTime(),
              sentAt: new Date(),
              emailTemplate: 'admin_triggered',
              recoveryDiscount: discountPercent,
              recoveryDiscountCode: `ADMIN-${Date.now()}`,
            },
          },
        }
      );

      return {
        success: true,
        emailsSent: carts.modifiedCount,
      };
    } catch (error) {
      console.error('Error sending bulk recovery emails:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = mongoose.model('AbandonedCart', abandonedCartSchema);
module.exports.AbandonedCartService = AbandonedCartService;
