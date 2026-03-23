// [Mongoose Removed] const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
const { validateEnv } = require('../config/env');

const config = validateEnv();

// Submit contact form
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { Resend } = require('resend');
    const { resend: resendConfig } = config.services;

    const newContact = { name, email, subject, message, createdAt: new Date() };

    // Send email notification via Resend
    try {
      if (resendConfig.apiKey) {
        const resend = new Resend(resendConfig.apiKey);

        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: config.services.adminEmail || 'admin@omnora.com',
          subject: `New Contact Form: ${subject}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message}</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification via Resend:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      contact: newContact
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getContactSubmissions = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ error: 'Contact submission not found' });

    contact.status = status;
    await contact.save();

    res.json({ success: true, message: 'Contact status updated', contact });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};