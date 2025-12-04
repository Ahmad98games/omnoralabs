/**
 * OneClickCheckout Controller
 * Handles one-click checkout operations
 */

const OneClickCheckout = require('../models/OneClickCheckout');

exports.setupOneClickCheckout = async (req, res) => {
  try {
    const { paymentMethods, shippingAddress, preferences } = req.body;
    const userId = req.user.id;

    let checkout = await OneClickCheckout.findOne({ userId });

    if (checkout) {
      checkout.paymentMethods = paymentMethods || checkout.paymentMethods;
      checkout.defaultShippingAddress = shippingAddress || checkout.defaultShippingAddress;
      checkout.preferences = preferences || checkout.preferences;
      await checkout.save();
    } else {
      checkout = await OneClickCheckout.create({
        userId,
        paymentMethods,
        defaultShippingAddress: shippingAddress,
        preferences,
      });
    }

    res.status(200).json({
      success: true,
      data: checkout,
      message: 'One-click checkout configured',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getOneClickCheckout = async (req, res) => {
  try {
    const userId = req.user.id;

    const checkout = await OneClickCheckout.findOne({ userId });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        error: 'One-click checkout not configured',
      });
    }

    res.status(200).json({
      success: true,
      data: checkout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod } = req.body;

    const checkout = await OneClickCheckout.findOneAndUpdate(
      { userId },
      {
        $push: { paymentMethods: paymentMethod },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: checkout,
      message: 'Payment method added',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.removePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethodId } = req.params;

    const checkout = await OneClickCheckout.findOneAndUpdate(
      { userId },
      {
        $pull: { 'paymentMethods._id': paymentMethodId },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: checkout,
      message: 'Payment method removed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.performOneClickCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItems, paymentMethodId, skipReview } = req.body;

    const checkout = await OneClickCheckout.findOne({ userId });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        error: 'One-click checkout not configured',
      });
    }

    // Use auto-filled data
    const orderData = {
      userId,
      items: cartItems,
      shippingAddress: checkout.defaultShippingAddress,
      paymentMethod: paymentMethodId || checkout.preferences.preferredPaymentMethod,
      skipReview,
    };

    // TODO: Create order directly without review page

    // Increment statistics
    checkout.statistics.totalCheckouts += 1;
    checkout.statistics.lastCheckoutDate = new Date();
    await checkout.save();

    res.status(200).json({
      success: true,
      data: { orderId: 'will-be-generated' },
      message: 'One-click checkout completed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;

    // Unset all defaults first
    await OneClickCheckout.updateOne(
      { userId },
      { $set: { 'paymentMethods.$[].isDefault': false } }
    );

    // Set new default
    const checkout = await OneClickCheckout.findOneAndUpdate(
      { userId, 'paymentMethods._id': paymentMethodId },
      {
        $set: {
          'paymentMethods.$.isDefault': true,
          'preferences.preferredPaymentMethod': paymentMethodId,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: checkout,
      message: 'Default payment method updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * AbandonedCart Controller
 * Handles abandoned cart operations
 */

const { AbandonedCartService } = require('../models/AbandonedCart');

exports.trackCartAbandon = async (req, res) => {
  try {
    const { cartItems, cartTotals, sessionData } = req.body;
    const userId = req.user?.id || null;
    const guestEmail = req.body.guestEmail || null;

    const result = await AbandonedCartService.trackAbandonedCart(
      userId,
      guestEmail,
      cartItems,
      cartTotals,
      sessionData
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.recoverCart = async (req, res) => {
  try {
    const { recoveryToken } = req.params;

    const result = await AbandonedCartService.recoverCart(recoveryToken);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getAbandonedCarts = async (req, res) => {
  try {
    const { minValue, recoveryAttempts } = req.query;

    const result = await AbandonedCartService.getAbandonedCartsForAdmin({
      minValue: minValue ? parseInt(minValue) : null,
      recoveryAttempts: recoveryAttempts ? parseInt(recoveryAttempts) : null,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.sendRecoveryEmail = async (req, res) => {
  try {
    const { cartId, emailType } = req.body;

    let result;
    if (emailType === 'first') {
      result = await AbandonedCartService.sendFirstRecoveryEmail(cartId);
    } else if (emailType === 'second') {
      result = await AbandonedCartService.sendSecondRecoveryEmail(cartId);
    } else if (emailType === 'final') {
      result = await AbandonedCartService.sendFinalRecoveryEmail(cartId);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.sendBulkRecoveryEmails = async (req, res) => {
  try {
    const { cartIds, discountPercent } = req.body;

    const result = await AbandonedCartService.sendBulkRecoveryEmails(
      cartIds,
      discountPercent
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Bundle Controller
 */

const { BundleService } = require('../models/Bundle');

exports.createBundle = async (req, res) => {
  try {
    const bundleData = req.body;
    const result = await BundleService.createBundle(bundleData, req.user.id);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getBundleRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const result = await BundleService.getBundleRecommendations(productId, limit);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getTopBundles = async (req, res) => {
  try {
    const { limit } = req.query;

    const result = await BundleService.getTopPerformingBundles(limit);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.autoGenerateBundles = async (req, res) => {
  try {
    const result = await BundleService.autoGenerateBundles();

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.trackBundleView = async (req, res) => {
  try {
    const { bundleId } = req.params;

    const result = await BundleService.trackBundleView(bundleId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * ProductVariant Controller
 */

const { ProductVariantService } = require('../models/Phase1Models');

exports.getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await ProductVariantService.getVariantsForProduct(productId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateVariantStock = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { quantityChange } = req.body;

    const result = await ProductVariantService.updateVariantStock(variantId, quantityChange);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * FlashSale Controller
 */

const { FlashSaleService } = require('../models/Phase1Models');

exports.getActiveFlashSales = async (req, res) => {
  try {
    const result = await FlashSaleService.getActiveFlashSales();

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.trackFlashSaleImpression = async (req, res) => {
  try {
    const { flashSaleId } = req.params;

    const result = await FlashSaleService.trackFlashSaleImpression(flashSaleId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * OrderTracking Controller
 */

const { OrderTrackingService } = require('../models/Phase1Models');

exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await OrderTrackingService.getOrderTimeline(orderId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, location } = req.body;

    const result = await OrderTrackingService.updateOrderStatus(
      orderId,
      status,
      notes,
      location
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * BackInStockAlert Controller
 */

const BackInStockAlert = require('../models/Phase1Models').BackInStockAlert;

exports.subscribeBackInStockAlert = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    const alert = await BackInStockAlert.create({
      userId,
      productId,
      variantId,
      email,
    });

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Subscribed to back-in-stock alerts',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getMyAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    const alerts = await BackInStockAlert.find({
      userId,
      isActive: true,
    }).populate('productId', 'name image');

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.unsubscribeAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.id;

    await BackInStockAlert.findByIdAndUpdate(
      alertId,
      { isActive: false },
      { $and: [{ _id: alertId }, { userId }] }
    );

    res.status(200).json({
      success: true,
      message: 'Unsubscribed from alert',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
