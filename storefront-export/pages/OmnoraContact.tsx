/**
 * 🛠️ OMNORA LABS | UPLINK PROTOCOL (CONTACT MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Communication is the transmission of system requirements."
 * ---------------------------------------------------------
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Send, Globe, MessageSquare, ArrowRight, Terminal, Cpu, Database } from 'lucide-react';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import './OmnoraContact.css';

export default function Contact() {
  const [uplinkPayload, setUplinkPayload] = useState({
    name: '',
    email: '',
    protocol_type: '',
    data_stream: ''
  });

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);

  const handleDataInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUplinkPayload({ ...uplinkPayload, [e.target.name]: e.target.value });
  };

  const executeUplinkTransmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransmitting(true);
    OmnoraLogger.info(`Initiating uplink transmission for node: ${uplinkPayload.email}`);

    try {
      const response = await fetch('https://formspree.io/f/xvgzkpee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uplinkPayload.name,
          email: uplinkPayload.email,
          subject: uplinkPayload.protocol_type,
          message: uplinkPayload.data_stream
        })
      });

      if (response.ok) {
        setTransmissionSuccess(true);
        OmnoraLogger.info("Uplink transmission confirmed by remote gateway.");
        setUplinkPayload({ name: '', email: '', protocol_type: '', data_stream: '' });
      } else {
        OmnoraLogger.error("Uplink transmission rejected by remote gateway.");
        alert('TRANSMISSION_FAULT: GATEWAY_REJECTED_PAYLOAD');
      }
    } catch (fault) {
      OmnoraLogger.error("Primary uplink signal lost.", fault);
      alert('SIGNAL_LOST: CHECK_NETWORK_PROTOCOL');
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="contact-luxury-page">
      {/* HERO */}
      <header className="contact-hero-section">
        <div className="container hero-content">
          <span className="eyebrow font-mono" style={{ letterSpacing: '4px' }}>SYSTEM_UPLINK</span>
          <h1 className="h1 editorial-title font-mono uppercase">
            Protocol <br />
            <span className="font-serif italic text-royal">Established</span>
          </h1>
          <p className="description font-mono xsmall">
            Whether you are inquiring about a custom node configuration, seeking architectural advice, or tracking a system deployment—our specialists are here to assist you.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container section-padding">
        <div className="contact-layout-grid">

          {/* LEFT: INFO */}
          <div className="contact-details-col">
            <div className="detail-block">
              <h3 className="subtitle-serif-small mb-4 font-mono uppercase xsmall">KERNEL_HQ</h3>
              <div className="detail-item font-mono xsmall">
                <MapPin size={18} className="text-royal" />
                <span>NEW_SHAD_BAGH, LAHORE, PAKISTAN</span>
              </div>
              <div className="detail-item font-mono xsmall">
                <Phone size={18} className="text-royal" />
                <span>+92 333 4355475</span>
              </div>
              <div className="detail-item font-mono xsmall">
                <Mail size={18} className="text-royal" />
                <span>omnorainfo28@gmail.com</span>
              </div>
            </div>

            <div className="detail-block mt-12">
              <h3 className="subtitle-serif-small mb-4 font-mono uppercase xsmall">DIGITAL_NODES</h3>
              <div className="social-links-luxury font-mono xsmall">
                <a href="https://www.instagram.com/omnora_official/?__pwa=1" target="_blank" rel="noreferrer">INSTAGRAM</a>
                <a href="https://github.com/ahmad-labs" target="_blank" rel="noreferrer">GITHUB</a>
                <a href="#">TERMINAL_ACCESS</a>
              </div>
            </div>

            <div className="breadcrumbs-luxury mt-12 font-mono xsmall">
              <Link to="/" className="breadcrumb-link-luxury">KERNEL</Link>
              <span className="sep-gold">/</span>
              <span>UPLINK</span>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="contact-form-wrapper">
            <div className="form-card-luxury">
              <h2 className="subtitle-serif mb-8 font-mono uppercase">INITIATE_TRANSMISSION</h2>
              <form onSubmit={executeUplinkTransmission} className="luxury-form-box">
                <div className="form-group-luxury">
                  <label className="font-mono xsmall">NODE_OPERATOR_NAME</label>
                  <input
                    type="text"
                    name="name"
                    className="lux-input font-mono"
                    value={uplinkPayload.name}
                    onChange={handleDataInput}
                    required
                    placeholder="OPERATOR_ID"
                  />
                </div>

                <div className="form-group-luxury">
                  <label className="font-mono xsmall">RETURN_GATEWAY_ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    className="lux-input font-mono"
                    value={uplinkPayload.email}
                    onChange={handleDataInput}
                    required
                    placeholder="NODE@STORAGE.SYS"
                  />
                </div>

                <div className="form-group-luxury">
                  <label className="font-mono xsmall">PROTOCOL_CLASSIFICATION</label>
                  <input
                    type="text"
                    name="protocol_type"
                    className="lux-input font-mono"
                    value={uplinkPayload.protocol_type}
                    onChange={handleDataInput}
                    required
                    placeholder="E.G. ARCHITECTURAL_QUERY"
                  />
                </div>

                <div className="form-group-luxury">
                  <label className="font-mono xsmall">DATA_STREAM_PAYLOAD</label>
                  <textarea
                    name="data_stream"
                    className="lux-input lux-textarea font-mono"
                    rows={4}
                    value={uplinkPayload.data_stream}
                    onChange={handleDataInput}
                    required
                    placeholder="TRANSMIT_SYSTEM_REQUIREMENTS..."
                  />
                </div>

                <button type="submit" className="btn-luxury-full font-mono" disabled={isTransmitting}>
                  {isTransmitting ? 'TRANSMITTING...' : 'EXECUTE_UPLINK'} <Terminal size={18} />
                </button>

                {transmissionSuccess && (
                  <div className="success-banner-gold font-mono xsmall uppercase">
                    TRANSMISSION_CONFIRMED: DATA_PAYLOAD_COMMITTED_TO_REGISTRY.
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
          <span className="eyebrow text-center mb-8 font-mono xsmall">DEPLOYMENT_COORDINATES</span>
          <div className="map-frame-wrapper">
            <iframe
              className="map-frame-luxury"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54415.82527236526!2d74.3000!3d31.5800!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39191c71360c7a5f%3A0xc39722393226759c!2sShadbagh%2C%20Lahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
              allowFullScreen
              loading="lazy"
              title="Omnora Kernel Deployment Coordinates"
            />
          </div>
        </div>
      </section>

      <footer className="footer-luxury section-padding">
        <div className="container text-center">
          <span className="footer-logo font-mono" style={{ letterSpacing: '4px' }}>OMNORA_LABS</span>
          <p className="copyright font-mono xsmall">&copy; {new Date().getFullYear()} OMNORA_KERNEL. ALL SYSTEM_RIGHTS_RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}

}