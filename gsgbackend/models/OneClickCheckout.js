/**
 * OneClickCheckout Model
 * Manages saved payment methods and one-click checkout preferences
 */

const mongoose = require('mongoose');

const oneClickCheckoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Payment Method Information
    paymentMethods: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        type: {
          type: String,
          enum: ['card', 'wallet', 'bank_transfer'],
          required: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        // For Cards
        cardLast4: String,
        cardBrand: String, // Visa, Mastercard, etc.
        cardExpiry: String,
        cardToken: String, // Tokenized for security

        // For Bank Transfer
        bankAccount: String, // Last 4 digits
        bankCode: String,

        // For Wallet
        walletName: String,
        walletId: String,

        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Shipping Address (Default)
    defaultShippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      province: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Pakistan',
      },
      label: {
        type: String,
        default: 'Home',
      },
    },

    // Preferences
    preferences: {
      autoFillName: {
        type: Boolean,
        default: true,
      },
      autoFillEmail: {
        type: Boolean,
        default: true,
      },
      autoFillPhone: {
        type: Boolean,
        default: true,
      },
      autoFillAddress: {
        type: Boolean,
        default: true,
      },
      preferredShippingMethod: String, // 'standard', 'express', 'overnight'
      preferredPaymentMethod: mongoose.Schema.Types.ObjectId,
      applyLastDiscount: {
        type: Boolean,
        default: true,
      },
    },

    // Quick Options
    quickOptions: {
      giftWrap: {
        type: Boolean,
        default: false,
      },
      expressCheckout: {
        type: Boolean,
        default: false,
      },
      skipReview: {
        type: Boolean,
        default: false,
      },
    },

    // Statistics
    statistics: {
      totalCheckouts: {
        type: Number,
        default: 0,
      },
      successfulCheckouts: {
        type: Number,
        default: 0,
      },
      failedCheckouts: {
        type: Number,
        default: 0,
      },
      lastCheckoutDate: Date,
      totalSpend: {
        type: Number,
        default: 0,
      },
    },

    // Security
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    biometricEnabled: {
      type: Boolean,
      default: false,
    },
    requiredVerificationForCheckout: {
      type: Boolean,
      default: false,
    },

    // Activity Tracking
    lastModified: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
oneClickCheckoutSchema.index({ userId: 1, isActive: 1 });
oneClickCheckoutSchema.index({ 'paymentMethods._id': 1 });

module.exports = mongoose.model('OneClickCheckout', oneClickCheckoutSchema);
