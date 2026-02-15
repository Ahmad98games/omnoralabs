import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, Globe, MessageSquare, ArrowRight } from 'lucide-react';
import './OmnoraContact.css';

const Footer = () => (
  <footer className="footer-luxury section-padding">
    <div className="container text-center">
      <span className="footer-logo">GOLD SHE GARMENTS</span>
      <p className="copyright">&copy; {new Date().getFullYear()} GSG Atelier. All rights reserved.</p>
    </div>
  </footer>
);

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('https://formspree.io/f/xvgzkpee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('Transmission failed. Please retry.');
      }
    } catch (error) {
      alert('Signal lost. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-luxury-page">
      {/* HERO */}
      <header className="contact-hero-section">
        <div className="container hero-content">
          <span className="eyebrow">CONCIERGE</span>
          <h1 className="h1 editorial-title">
            At Your <br />
            <span className="font-serif italic text-gold">Service</span>
          </h1>
          <p className="description">
            Whether you are inquiring about a custom piece, seeking style advice, or tracking an atelier shipment—our specialists are here to assist you.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container section-padding">
        <div className="contact-layout-grid">

          {/* LEFT: INFO */}
          <div className="contact-details-col">
            <div className="detail-block">
              <h3 className="subtitle-serif-small mb-4">The Atelier HQ</h3>
              <div className="detail-item">
                <MapPin size={18} className="text-gold" />
                <span>New Shad Bagh, Lahore, Pakistan</span>
              </div>
              <div className="detail-item">
                <Phone size={18} className="text-gold" />
                <span>+92 333 4355475</span>
              </div>
              <div className="detail-item">
                <Mail size={18} className="text-gold" />
                <span>omnorainfo28@gmail.com</span>
              </div>
            </div>

            <div className="detail-block mt-12">
              <h3 className="subtitle-serif-small mb-4">Digital Presence</h3>
              <div className="social-links-luxury">
                <a href="https://www.instagram.com/omnora_official/?__pwa=1" target="_blank" rel="noreferrer">Instagram</a>
                <a href="#">Facebook</a>
                <a href="#">Pinterest</a>
              </div>
            </div>

            <div className="breadcrumbs-luxury mt-12">
              <Link to="/" className="breadcrumb-link-luxury">Home</Link>
              <span className="sep-gold">/</span>
              <span>Contact</span>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="contact-form-wrapper">
            <div className="form-card-luxury">
              <h2 className="subtitle-serif mb-8">Send an Inquiry</h2>
              <form onSubmit={handleSubmit} className="luxury-form-box">
                <div className="form-group-luxury">
                  <label>YOUR NAME</label>
                  <input
                    type="text"
                    name="name"
                    className="lux-input"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="form-group-luxury">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    className="lux-input"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="jane@example.com"
                  />
                </div>

                <div className="form-group-luxury">
                  <label>MESSAGE</label>
                  <textarea
                    name="message"
                    className="lux-input lux-textarea"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <button type="submit" className="btn-luxury-full" disabled={submitting}>
                  {submitting ? 'SENDING...' : 'SUBMIT INQUIRY'} <ArrowRight size={18} />
                </button>

                {success && (
                  <div className="success-banner-gold">
                    Your message has been received by the atelier. We will respond shortly.
                  </div>
                )}
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* MAP */}
      <section className="map-luxury-section">
        <div className="container">
          <span className="eyebrow text-center mb-8">LOCATION</span>
          <div className="map-frame-wrapper">
            <iframe
              className="map-frame-luxury"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54415.82527236526!2d74.3000!3d31.5800!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39191c71360c7a5f%3A0xc39722393226759c!2sShadbagh%2C%20Lahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
              allowFullScreen
              loading="lazy"
              title="GSG Atelier Location"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}