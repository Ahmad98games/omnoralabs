import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import './OmnoraFAQ.css';

const Footer = () => (
  <footer className="footer-luxury section-padding">
    <div className="container text-center">
      <span className="footer-logo">GOLD SHE GARMENTS</span>
      <p className="copyright">&copy; {new Date().getFullYear()} GSG Atelier. All rights reserved.</p>
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
      question: "Exchanges & Boutique Credit",
      answer: (
        <>
          <p>We take pride in the quality of our garments. To initiate an exchange:</p>
          <ol>
            <li>Contact our concierge team within 7 days of delivery.</li>
            <li>Ensure the garment is in its original, unworn condition with all atelier tags attached.</li>
            <li>Securely pack the piece in its original luxury packaging.</li>
            <li>Ship back to our Lahore studio for assessment.</li>
          </ol>
          <p className="note-text-luxury">
            Note: Boutique credit will be issued upon successful inspection of the returned piece.
          </p>
        </>
      )
    },
    {
      question: "Shipping Responsibility",
      answer: "While we ensure secure dispatch, return shipping costs for exchanges are the responsibility of the client. In the rare event of a craftsmanship defect, Gold She Garments will provide a complimentary pickup or internal reimbursement."
    },
    {
      question: "Atelier Refund Policy",
      answer: "Refunds are processed as boutique credit or reverted to the original payment source within 7-14 business days of receipt at our studio. Bank processing times may apply depending on your financial institution."
    }
  ];

  return (
    <div className="faq-luxury-page">
      {/* HERO */}
      <header className="faq-hero-section">
        <div className="container hero-content">
          <span className="eyebrow">ASSISTANCE</span>
          <h1 className="h1 editorial-title">
            Atelier <br />
            <span className="font-serif italic text-gold">Protocols</span>
          </h1>
          <p className="description">
            Your guide to acquiring, caring for, and exchanging your Gold She fine garments.
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
                Craftsmanship Note
              </h3>

              <p className="note-description">
                Every piece in our collection is hand-finished by master artisans. As we scale our legacy, our concierge team handles every query personally.
              </p>

              <p className="note-description mt-4">
                We avoid automation to ensure that your luxury experience remains human and dedicated.
              </p>

              <div className="atelier-cta mt-8">
                <Link to="/contact" className="btn-atelier-link">
                  Open Concierge Channel <ArrowRight size={16} />
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