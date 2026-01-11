import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShieldAlert, Mail } from 'lucide-react';
import './OmnoraFAQ.css';

// ----------------------------------------------------
// 1. FOOTER COMPONENT
// ----------------------------------------------------
const Footer = () => (
  <footer className="footer-magnum">
    <div className="container">
      &copy; {new Date().getFullYear()} Omnora Labs. All rights reserved. <br/>
      <span className="footer-credit">Operated and Developed By Ahmad Mahboob</span>
    </div>
  </footer>
);

// ----------------------------------------------------
// 2. MAIN FAQ COMPONENT
// ----------------------------------------------------
export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "PROTOCOL: Returns & Exchanges",
      answer: (
        <>
          <p>To initiate a return sequence:</p>
          <ol>
            <li>Contact Command (Customer Service) for authorization.</li>
            <li>Secure artifact in original stasis packaging.</li>
            <li>Attach the provided return vector form.</li>
            <li>Dispatch to the coordinates provided.</li>
          </ol>
          <p className="note-text">
            Note: For exchanges, specify your desired replacement artifact.
          </p>
        </>
      )
    },
    {
      question: "PROTOCOL: Return Shipping Liability",
      answer: "Shipping vectors are the responsibility of the client, except in instances of structural defect or internal error. In such events, Omnora Labs will provide a prepaid label or reimbursement."
    },
    {
      question: "PROTOCOL: Refund Timeline",
      answer: "Refunds are processed within 7-14 standard cycles (days) of receipt. Funds will revert to the original payment source. Bank processing times (3-5 days) may vary."
    }
  ];

  return (
    <div className="faq-magnum-page">
      <div className="noise-layer" />

      {/* HERO */}
      <header className="container faq-hero-magnum">
        <h1 className="hero-super-title">
          <span>Omnora Knowledge Base</span>
          FAQ Protocols
        </h1>
        <div className="hero-desc">
          Operational guidelines for the acquisition, usage, and return of Omnora Sanctuary artifacts.
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container faq-layout">
        
        {/* SIDEBAR */}
        <aside>
          <div className="manifesto-card">
            <h3 className="manifesto-title">
              <ShieldAlert size={20} />
              Operational Status
            </h3>
            
            <p className="manifesto-text">
              <strong>Attention Client:</strong> As we are currently in our foundational phase, our support infrastructure is lean but dedicated.
            </p>
            
            <p className="manifesto-text">
              We do not use automated bots. Every query is handled by the core team. We appreciate your patience as we scale our operations.
            </p>

            <div className="manifesto-note">
              "Every artifact is coded and crafted by individual developers. Your feedback directly shapes our future."
              <br/>
              <Link to="/contact" className="sidebar-link">
                Open Comms Channel →
              </Link>
            </div>
          </div>

          <div className="breadcrumbs-sidebar">
             <Link to="/" className="crumb-link">Home</Link> / Protocols
          </div>
        </aside>

        {/* MAIN ACCORDION */}
        <main>
          <h2 className="faq-group-title">Standard Operating Procedures</h2>
          
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item-magnum ${activeIndex === index ? 'active' : ''}`}>
                <button className="faq-trigger" onClick={() => toggleFAQ(index)}>
                  <span className="faq-q-text">{faq.question}</span>
                  <div className="faq-icon-box">
                    <Plus size={18} />
                  </div>
                </button>
                <div className="faq-content">
                  <div className="faq-inner">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CONTACT BLOCK */}
          <div className="contact-block">
            <h3 className="contact-title">Unresolved Query?</h3>
            <p className="contact-sub">
              If your required data is not listed above, establish a direct link.
            </p>
            
            <a href="mailto:omnorainfo28@gmail.com" className="btn-contact">
              <Mail size={16} style={{marginRight: '8px'}}/> Email Support
            </a>
            
            <div className="contact-meta">
              Direct Line: +92 3334355475 <br/>
              (Mon-Sat, 1100h - 2100h PKT)
            </div>
          </div>
        </main>

      </div>

      <Footer />
    </div>
  );
}