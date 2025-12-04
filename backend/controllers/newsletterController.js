const Newsletter = require('../models/Newsletter');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Subscribe to newsletter
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({ error: 'Email is already subscribed' });
      } else {
        // Reactivate subscription
        existingSubscription.isActive = true;
        await existingSubscription.save();
        
        return res.json({ 
          success: true, 
          message: 'Subscription reactivated successfully' 
        });
      }
    }
    
    // Create new subscription
    const newSubscription = new Newsletter({ email });
    await newSubscription.save();
    
    // Send confirmation email
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Newsletter Subscription Confirmation',
        html: `
          <h2>Thank You for Subscribing!</h2>
          <p>You have successfully subscribed to our newsletter. You will now receive updates on our latest collections, exclusive offers, and fashion tips.</p>
          <p>If you did not subscribe to our newsletter, please click <a href="https://yourdomain.com/unsubscribe?email=${email}">here</a> to unsubscribe.</p>
        `
      };
      
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with the response even if email fails
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

// Unsubscribe from newsletter
exports.unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const subscription = await Newsletter.findOne({ email });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    subscription.isActive = false;
    await subscription.save();
    
    res.json({ 
      success: true, 
      message: 'Unsubscribed successfully' 
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all subscribers (admin only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 