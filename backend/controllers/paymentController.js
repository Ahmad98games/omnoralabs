const { validateEnv } = require('../config/env');
const config = validateEnv();
const stripe = require('stripe')(config.payments.stripe.secretKey);
const logger = require('../services/logger');
// [Mongoose Removed] const Order = require('../models/Order');
// [Mongoose Removed] const Product = require('../models/Product');

/**
 * @desc    Create Stripe Checkout Session
 * @route   POST /api/payment/checkout/create-session
 * @access  Public (or Tenant Protected)
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, tenantId } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 1. Fetch real products from DB to prevent price tampering
    const productIds = items.map(item => item.id);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    // 2. Build line items with verified prices
    const lineItems = items.map(item => {
      const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
      
      if (!dbProduct) {
        throw new Error(`Product not found: ${item.id}`);
      }

      // If variant has price override, we should ideally check that too
      // For now, using the base product price as a primary safeguard
      const priceInCents = Math.round(dbProduct.price * 100);

      return {
        price_data: {
          currency: 'usd', // Adjust currency as needed
          product_data: {
            name: dbProduct.name,
            images: dbProduct.image ? [dbProduct.image] : [],
            metadata: {
              productId: dbProduct._id.toString(),
              variant: item.variantId || ''
            }
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity,
      };
    });

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${config.server.clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.server.clientUrl}/cart`,
      metadata: {
        tenantId: tenantId || 'default',
        cartItems: JSON.stringify(items.map(i => ({ id: i.id, q: i.q, v: i.v || '' })))
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    logger.error('Checkout Session creation failure', { error: error.message });
    res.status(500).json({ error: error.message || 'Payment initiation failed' });
  }
};

// @desc    Create Stripe payment intent
exports.createStripeIntent = async (req, res) => {
  try {
    const { amount, currency = 'pkr', orderId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: { orderId: orderId || '', userId: req.user?.id || '' },
      automatic_payment_methods: { enabled: true }
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    logger.error('Stripe intent creation error', { error: error.message });
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

exports.verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      res.json({ success: true, status: 'succeeded', amount: paymentIntent.amount / 100 });
    } else {
      res.json({ success: false, status: paymentIntent.status });
    }
  } catch (error) {
    logger.error('Stripe verification error', { error: error.message });
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

exports.initJazzCashPayment = async (req, res) => {
  try {
    const { amount, phoneNumber, orderId } = req.body;
    logger.info('JazzCash payment initiated', { amount, orderId });
    res.json({ success: true, message: 'JazzCash payment initiated.', transactionId: `JC${Date.now()}`, status: 'pending' });
  } catch (error) {
    logger.error('JazzCash init error', { error: error.message });
    res.status(500).json({ error: 'Failed to initialize JazzCash payment' });
  }
};

exports.verifyJazzCashPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    logger.info('JazzCash payment verified', { transactionId });
    res.json({ success: true, status: 'completed', transactionId });
  } catch (error) {
    logger.error('JazzCash verify error', { error: error.message });
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

exports.createPayPalOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    logger.info('PayPal order created', { amount, orderId });
    res.json({ success: true, orderId: `PAYPAL${Date.now()}`, approvalUrl: 'https://www.paypal.com/checkoutnow?token=mock' });
  } catch (error) {
    logger.error('PayPal create error', { error: error.message });
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
};

exports.capturePayPalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    logger.info('PayPal payment captured', { orderId });
    res.json({ success: true, status: 'completed' });
  } catch (error) {
    logger.error('PayPal capture error', { error: error.message });
    res.status(500).json({ error: 'Failed to capture payment' });
  }
};

exports.processCODOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    logger.info('COD order processed', { orderId });
    res.json({ success: true, message: 'Order placed successfully.', paymentMethod: 'cod' });
  } catch (error) {
    logger.error('COD process error', { error: error.message });
    res.status(500).json({ error: 'Failed to process COD order' });
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = {
      international: [{ id: 'stripe', name: 'Credit/Debit Card', logo: '💳', enabled: true }, { id: 'paypal', name: 'PayPal', logo: '🅿️', enabled: true }],
      pakistan: [{ id: 'jazzcash', name: 'JazzCash', logo: '📱', enabled: true }, { id: 'easypaisa', name: 'EasyPaisa', logo: '💰', enabled: true }, { id: 'bank', name: 'Bank Transfer', logo: '🏦', enabled: true }, { id: 'cod', name: 'Cash on Delivery', logo: '💵', enabled: true }]
    };
    res.json({ success: true, methods });
  } catch (error) {
    logger.error('Get payment methods error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};