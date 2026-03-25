import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import './OmnoraFAQ.css';

const Footer = () => (
  <footer className="footer-luxury section-padding">
    <div className="container text-center">
      <span className="footer-logo">OMNORA LABS</span>
      <p className="copyright">&copy; {new Date().getFullYear()} Omnora Labs. All rights reserved.</p>
    </div>
  </footer>
);

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "System Scalability & Elasticity",
      answer: (
        <>
          <p>The Omnora Kernel is designed for global distribution. Our infrastructure ensures:</p>
          <ol>
            <li>Zero-latency rendering via Edge-optimized pipelines.</li>
            <li>Multi-tenant isolation for secure asset management.</li>
            <li>Hyper-modular component injection for infinite modification.</li>
            <li>Automated sync with the Supabase/Zustand state layer.</li>
          </ol>
          <p className="note-text-luxury">
            Note: The current storefront is a live production benchmark and prototype.
          </p>
        </>
      )
    },
    {
      question: "Global Availability",
      answer: "Omnora Labs is currently in 'Limited Access' for production environments. While the builder is available globally, the full commerce engine is being rolled out territory by territory to ensure system integrity."
    },
    {
      question: "Modification Protocol",
      answer: "Omnora is open for top-tier contributors. Any modification to the core kernel must follow our strict architectural protocols documented in the Contributor Guide."
    }
  ];

  return (
    <div className="faq-luxury-page">
      {/* HERO */}
      <header className="faq-hero-section">
        <div className="container hero-content">
          <span className="eyebrow">ASSISTANCE</span>
          <h1 className="h1 editorial-title">
            System <br />
            <span className="font-serif italic text-gold">Protocols</span>
          </h1>
          <p className="description">
            Your technical guide to understanding, contributing to, and deploying the Omnora Kernel.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container section-padding">
        <div className="faq-layout-grid">

          {/* SIDEBAR */}
          <aside className="faq-sidebar-luxury">
            <div className="atelier-note-card">
              <h3 className="subtitle-serif-small mb-4">
                <ShieldCheck size={20} className="text-gold mr-2" />
                Kernel Integrity
              </h3>

              <p className="note-description">
                Every line of code in the Omnora Kernel is optimized for speed and fidelity. We prioritize architectural purity over rapid bloat.
              </p>

              <p className="note-description mt-4">
                Our team monitors system performance 24/7 to ensure zero-downtime distribution.
              </p>

              <div className="atelier-cta mt-8">
                <Link to="/contact" className="btn-atelier-link">
                  Open Dev Channel <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="breadcrumbs-luxury mt-8">
              <Link to="/" className="breadcrumb-link-luxury">Home</Link>
              <span className="sep-gold">/</span>
              <span>Protocols</span>
            </div>
          </aside>

          {/* MAIN ACCORDION */}
          <main className="faq-main-content">
            <h2 className="subtitle-serif mb-8">Service Standards</h2>

            <div className="faq-list-luxury">
              {faqs.map((faq, index) => (
                <div key={index} className={`faq-item-luxury ${activeIndex === index ? 'active' : ''}`}>
                  <button className="faq-trigger-luxury" onClick={() => toggleFAQ(index)}>
                    <span className="faq-q-text-luxury">{faq.question}</span>
                    <div className="faq-icon-box-luxury">
                      {activeIndex === index ? <Minus size={18} /> : <Plus size={18} />}
                    </div>
                  </button>
                  <div className={`faq-content-luxury ${activeIndex === index ? 'expanded' : ''}`}>
                    <div className="faq-inner-luxury">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTACT BLOCK */}
            <div className="contact-prompt-luxury mt-16">
              <h3 className="subtitle-serif-small mb-4">Unresolved Inquiry?</h3>
              <p className="text-muted mb-8">
                If your specific requirement is not addressed, please establish a direct link with our studio.
              </p>

              <a href="mailto:omnorainfo28@gmail.com" className="btn-luxury-outline">
                <Mail size={16} /> Contact Support
              </a>

              <div className="concierge-meta mt-8">
                Studio Line: +92 3334355475 <br />
                (Mon-Sat, 11:00 AM - 9:00 PM PKT)
              </div>
            </div>
          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
}