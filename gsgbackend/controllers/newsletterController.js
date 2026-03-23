// [Mongoose Removed] const Newsletter = require('../models/Newsletter');
const nodemailer = require('nodemailer');
const { validateEnv } = require('../config/env');

const config = validateEnv();

// Subscribe to newsletter
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { Resend } = require('resend');
    const { resend: resendConfig } = config.services;

    // Send confirmation email via Resend
    try {
      if (resendConfig.apiKey) {
        const resend = new Resend(resendConfig.apiKey);

        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Newsletter Subscription Confirmation',
          html: `
            <h2>Thank You for Subscribing!</h2>
            <p>You have successfully subscribed to our newsletter.</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending confirmation email via Resend:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Subscription successful'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const subscription = await Newsletter.findOne({ email });
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    subscription.isActive = false;
    await subscription.save();

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Server error' });
  }
};