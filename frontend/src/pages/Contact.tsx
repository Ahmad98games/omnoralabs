import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Contact.css'

// ----------------------------------------------------
// 1. FOOTER COMPONENT DEFINITION MOVED OUTSIDE Contact
// ----------------------------------------------------
const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-bottom" style={{ textAlign: 'center' }}> {/* Added inline style for centering */}
        &copy; {new Date().getFullYear()} Omnora. All rights reserved. |Operated and Developed By Ahmad Mahboob
      </div>
    </div>
  </footer>
);

// ----------------------------------------------------
// 2. MAIN CONTACT COMPONENT
// ----------------------------------------------------
export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate form submission
    try {
      const response = await fetch('https://formspree.io/f/xvgzkpee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        setSuccess(true)
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // Use Fragment to return both the page content and the Footer
    <>
      <div className="contact-page">
        <header className="contact-hero">
          <div className="contact-hero-content">
            <h1 className="contact-hero-title">Contact Us</h1>
            <p className="contact-hero-subtitle">We'd love to hear from you</p>
          </div>
        </header>

        <div className="contact-container">
          <div className="breadcrumbs" style={{ marginBottom: '2rem' }}>
            <ul className="breadcrumbs-list">
              <li className="breadcrumbs-item"><Link to="/" className="breadcrumbs-link">Home</Link></li>
              <li className="breadcrumbs-item">Contact</li>
            </ul>
          </div>

          <div className="contact-content">
            {/* Contact Form */}
            <div className="contact-form-container">
              <h2 className="contact-section-title">Send Us a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="form-input"
                    value={form.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-input"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="luxury-button" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
                {success && (
                  <div className="success-message">Thank you for your message. We'll respond soon.</div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div className="contact-info-container">
              <h2 className="contact-section-title">Contact Information</h2>
              <div className="contact-info">
                <div className="contact-info-item">
                  <p className="contact-info-text" style={{ fontWeight: 'bold' }}>Omnora</p>
                  <p className="contact-info-text">New Shad bagh</p>
                  <p className="contact-info-text">Lahore</p>
                  <p className="contact-info-text">Pakistan</p>
                </div>
                <div className="contact-info-item">
                  <h3 className="contact-info-title">Opening Hours</h3>
                  <p className="contact-info-text">Not Fixed. When ordered, we will be available.</p>
                  <p className="contact-info-text">Sunday: 12:00 PM - 6:00 PM</p>
                </div>
                <div className="contact-info-item">
                  <h3 className="contact-info-title">Contact Details</h3>
                  <p className="contact-info-text">Phone: +92 333 4355475</p>
                  <p className="contact-info-text">Email: OmnoraInfo28@gmail.com</p>
                </div>
                <div className="contact-info-item">
                  <h3 className="contact-info-title">Follow Us</h3>
                  <div className="contact-social-links">
                    <a href="https://www.instagram.com/omnora_official/?__pwa=1" className="contact-social-link" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="#" className="contact-social-link">Facebook</a>
                    <a href="#" className="contact-social-link">Pinterest</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store Location Map */}
          <div className="store-location">
            <h2 className="contact-section-title">Our Location</h2>
            <div className="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3400.5681366953!2d74.31292931500853!3d31.5342344813775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190458d16e1ba3%3A0xc36a312c3d1c8722!2sAnarkali%20Bazaar!5e0!3m2!1sen!2s!4v1647872134582!5m2!1sen!2s"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Omnora Location"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 🛑 RENDER THE FOOTER HERE, inside the fragment */}
      <Footer />
    </>
  )
}