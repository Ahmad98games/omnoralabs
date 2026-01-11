import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, Globe, MessageSquare, ArrowLeft } from 'lucide-react';
import './OmnoraContact.css';

// ----------------------------------------------------
// 1. FOOTER COMPONENT
// ----------------------------------------------------
const Footer = () => (
  <footer className="footer-magnum">
    <div className="container">
      © {new Date().getFullYear()} Omnora Labs. All rights reserved. <br/>
      <span className="footer-credit">Operated and Developed By Ahmad Mahboob</span>
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
    <div className="contact-magnum-page">
      <div className="noise-layer" />

      {/* HERO */}
      <header className="container contact-hero-magnum">
        <h1 className="hero-super-title">
          <span>Secure Channel</span>
          Establish<br/>Connection
        </h1>
        <div className="hero-desc">
          Whether for collaboration, inquiries, or feedback—our frequencies are open. Transmit your message below.
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="container contact-layout">
        
        {/* LEFT COLUMN: INFO */}
        <div className="contact-info-col">
          
          <div className="info-block">
            <h3 className="info-label"><MapPin size={20} className="icon-gold"/> Coordinates</h3>
            <div className="data-row">
               <div className="data-key">Base of Operations</div>
               <div className="data-val">New Shad Bagh, Lahore</div>
               <div className="data-val-sub">Pakistan</div>
            </div>
          </div>

          <div className="info-block">
            <h3 className="info-label"><Globe size={20} className="icon-cyan"/> Comms Channels</h3>
            
            <div className="data-row">
               <div className="data-key">Direct Line</div>
               <div className="data-val">+92 333 4355475</div>
            </div>

            <div className="data-row">
               <div className="data-key">Digital Mail</div>
               <div className="data-val">OmnoraInfo28@gmail.com</div>
            </div>

            <div className="data-row">
               <div className="data-key">Availability</div>
               <div className="data-val-sub">
                 Flexible Hours. <br/>
                 Sun: 1200h - 1800h
               </div>
            </div>
          </div>

          <div className="info-block">
             <h3 className="info-label"><MessageSquare size={20} /> Network Nodes</h3>
             <div className="social-grid">
               <a href="https://www.instagram.com/omnora_official/?__pwa=1" target="_blank" rel="noreferrer" className="social-node">
                 Instagram
               </a>
               <a href="#" className="social-node">Facebook</a>
               <a href="#" className="social-node">Pinterest</a>
             </div>
          </div>

          {/* Breadcrumbs */}
          <div className="breadcrumbs-nav">
             <Link to="/" className="breadcrumb-link">Home</Link> <span className="separator">/</span> Contact
          </div>

        </div>

        {/* RIGHT COLUMN: FORM TERMINAL */}
        <div className="contact-form-col">
          <div className="form-terminal">
            <h2 className="terminal-title">Transmission Uplink</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Identifier (Name)</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  className="form-input" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="_"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Return Vector (Email)</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  className="form-input" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="_"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subject">Topic</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  className="form-input" 
                  value={form.subject} 
                  onChange={handleChange} 
                  required 
                  placeholder="_"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">Data Payload (Message)</label>
                <textarea 
                  id="message" 
                  name="message" 
                  className="form-input" 
                  rows={5} 
                  value={form.message} 
                  onChange={handleChange} 
                  required 
                  placeholder="..."
                />
              </div>

              <button type="submit" className="btn-transmit" disabled={submitting}>
                 {submitting ? 'Transmitting...' : 'Send Signal'} <Send size={18} />
              </button>

              {success && (
                <div className="success-msg">
                  Signal Received. Stand by for response.
                </div>
              )}

            </form>
          </div>
        </div>

      </div>

      {/* MAP SECTION */}
      <div className="container map-section">
        <h2 className="map-overlay-text">Tactical View</h2>
        {/* Valid Google Maps Embed for Lahore */}
        <iframe
          className="map-frame"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54415.82527236526!2d74.3000!3d31.5800!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39191c71360c7a5f%3A0xc39722393226759c!2sShadbagh%2C%20Lahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
          allowFullScreen
          loading="lazy"
          title="Omnora HQ Location"
        />
      </div>

      <Footer />
    </div>
  );
}