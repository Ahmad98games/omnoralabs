const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const logger = require('../services/logger');
const Order = require('../models/Order');

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
// @access  Private
exports.createStripeIntent = async (req, res) => {
  try {
    const { amount, currency = 'pkr', orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency: currency.toLowerCase(),
      metadata: {
        orderId: orderId || '',
        userId: req.user?.id || ''
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Stripe intent creation error', { error: error.message });
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// @desc    Verify Stripe payment
// @route   POST /api/payments/stripe/verify
// @access  Private
exports.verifyStripePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      res.json({
        success: true,
        status: 'succeeded',
        amount: paymentIntent.amount / 100
      });
    } else {
      res.json({
        success: false,
        status: paymentIntent.status
      });
    }
  } catch (error) {
    logger.error('Stripe verification error', { error: error.message });
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// @desc    Initialize JazzCash payment
// @route   POST /api/payments/jazzcash/init
// @access  Private
exports.initJazzCashPayment = async (req, res) => {
  try {
    const { amount, phoneNumber, orderId } = req.body;

    // JazzCash integration would go here
    // For now, returning a mock response
    logger.info('JazzCash payment initiated', { amount, orderId });

    res.json({
      success: true,
      message: 'JazzCash payment initiated. Please complete payment on your mobile.',
      transactionId: `JC${Date.now()}`,
      status: 'pending'
    });
  } catch (error) {
    logger.error('JazzCash init error', { error: error.message });
    res.status(500).json({ error: 'Failed to initialize JazzCash payment' });
  }
};

// @desc    Verify JazzCash payment
// @route   POST /api/payments/jazzcash/verify
// @access  Private
exports.verifyJazzCashPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    // JazzCash verification would go here
    logger.info('JazzCash payment verified', { transactionId });

    res.json({
      success: true,
      status: 'completed',
      transactionId
    });
  } catch (error) {
    logger.error('JazzCash verify error', { error: error.message });
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// @desc    Create PayPal order
// @route   POST /api/payments/paypal/create
// @access  Private
exports.createPayPalOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    // PayPal SDK integration would go here
    logger.info('PayPal order created', { amount, orderId });

    res.json({
      success: true,
      orderId: `PAYPAL${Date.now()}`,
      approvalUrl: 'https://www.paypal.com/checkoutnow?token=mock'
    });
  } catch (error) {
    logger.error('PayPal create error', { error: error.message });
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
};

// @desc    Capture PayPal payment
// @route   POST /api/payments/paypal/capture
// @access  Private
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // PayPal capture would go here
    logger.info('PayPal payment captured', { orderId });

    res.json({
      success: true,
      status: 'completed'
    });
  } catch (error) {
    logger.error('PayPal capture error', { error: error.message });
    res.status(500).json({ error: 'Failed to capture payment' });
  }
};

// @desc    Process COD order
// @route   POST /api/payments/cod/process
// @access  Private
exports.processCODOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    logger.info('COD order processed', { orderId });

    res.json({
      success: true,
      message: 'Order placed successfully. Pay on delivery.',
      paymentMethod: 'cod'
    });
  } catch (error) {
    logger.error('COD process error', { error: error.message });
    res.status(500).json({ error: 'Failed to process COD order' });
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Public
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = {
      international: [
        { id: 'stripe', name: 'Credit/Debit Card', logo: '💳', enabled: true },
        { id: 'paypal', name: 'PayPal', logo: '🅿️', enabled: true }
      ],
      pakistan: [
        { id: 'jazzcash', name: 'JazzCash', logo: '📱', enabled: true },
        { id: 'easypaisa', name: 'EasyPaisa', logo: '💰', enabled: true },
        { id: 'bank', name: 'Bank Transfer', logo: '🏦', enabled: true },
        { id: 'cod', name: 'Cash on Delivery', logo: '💵', enabled: true }
      ]
    };

    res.json({ success: true, methods });
  } catch (error) {
    logger.error('Get payment methods error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
};