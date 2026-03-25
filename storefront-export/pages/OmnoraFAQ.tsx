/**
 * 🛠️ OMNORA LABS | SYSTEM KNOWLEDGE BASE (FAQ MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Knowledge is the fuel for systemic optimization."
 * ---------------------------------------------------------
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, ShieldCheck, Mail, ArrowRight, Terminal, Cpu, Database } from 'lucide-react';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import './OmnoraFAQ.css';

export default function FAQ() {
  const [activeProtocolIndex, setActiveProtocolIndex] = useState<number | null>(0);

  const toggleProtocol = (index: number) => {
    setActiveProtocolIndex(activeProtocolIndex === index ? null : index);
    OmnoraLogger.info(`Protocol access toggled: index ${index}`);
  };

  const systemProtocols = [
    {
      question: "ENTITY_DECOMMISSIONING_PROTOCOL",
      answer: (
        <>
          <p className="font-mono xsmall">We maintain absolute integrity of deployed nodes. To initiate a de-configuration:</p>
          <ol className="font-mono xsmall">
            <li>Contact the central registry within 168 hours of deployment.</li>
            <li>Ensure the node is in its primary state with all industrial tags intact.</li>
            <li>Securely encapsulate the entity in its original deployment container.</li>
            <li>Ship back to the Lahore Core Registry for structural assessment.</li>
          </ol>
          <p className="note-text-luxury font-mono xsmall">
            NOTE: SYSTEM_CREDITS_ISSUED_UPON_SUCCESSFUL_AUDIT.
          </p>
        </>
      )
    },
    {
      question: "PROPAGATION_LOGISTICS",
      answer: (
        <p className="font-mono xsmall">
          While we ensure secure dispatch, return logistics for audits are the responsibility of the client node. 
          In the event of a documented kernel defect, Omnora Labs will provide complimentary extraction or internal credit reimbursement.
        </p>
      )
    },
    {
      question: "KERNEL_REFUND_STREAM",
      answer: (
        <p className="font-mono xsmall">
          Refunds are processed as SYSTEM_CREDITS or reverted to the primary payment gateway within 240-336 hours of receipt. 
          Financial institution processing latencies may apply.
        </p>
      )
    }
  ];

  return (
    <div className="faq-luxury-page">
      {/* HERO */}
      <header className="faq-hero-section">
        <div className="container hero-content">
          <span className="eyebrow font-mono" style={{ letterSpacing: '4px' }}>SYSTEM_PROTOCOLS</span>
          <h1 className="h1 editorial-title font-mono uppercase">
            Kernel <br />
            <span className="font-serif italic text-royal">Operations</span>
          </h1>
          <p className="description font-mono xsmall">
            Official documentation for acquiring, configuring, and auditing Omnora system entities.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="container section-padding">
        <div className="faq-layout-grid">

          {/* SIDEBAR */}
          <aside className="faq-sidebar-luxury">
            <div className="atelier-note-card">
              <h3 className="subtitle-serif-small mb-4 font-mono uppercase xsmall">
                <ShieldCheck size={20} className="text-royal mr-2" />
                CORE_INTEGRITY_MANIFEST
              </h3>

              <p className="note-description font-mono xsmall">
                Every entity in our registry is hand-finished by master engineers. As we scale our legacy, our support team handles every query personally.
              </p>

              <p className="note-description mt-4 font-mono xsmall">
                We avoid automation to ensure that your industrial experience remains human and dedicated.
              </p>

              <div className="atelier-cta mt-8">
                <Link to="/contact" className="btn-atelier-link font-mono xsmall uppercase">
                  OPEN_UPLINK_CHANNEL <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="breadcrumbs-luxury mt-8 font-mono xsmall">
              <Link to="/" className="breadcrumb-link-luxury">KERNEL</Link>
              <span className="sep-gold">/</span>
              <span>KNOWLEDGE_BASE</span>
            </div>
          </aside>

          {/* MAIN ACCORDION */}
          <main className="faq-main-content">
            <h2 className="subtitle-serif mb-8 font-mono uppercase">OPERATIONAL_STANDARDS</h2>

            <div className="faq-list-luxury">
              {systemProtocols.map((protocol, index) => (
                <div key={index} className={`faq-item-luxury ${activeProtocolIndex === index ? 'active' : ''}`}>
                  <button className="faq-trigger-luxury" onClick={() => toggleProtocol(index)}>
                    <span className="faq-q-text-luxury font-mono xsmall uppercase" style={{ fontWeight: 600 }}>{protocol.question}</span>
                    <div className="faq-icon-box-luxury">
                      {activeProtocolIndex === index ? <Minus size={18} /> : <Plus size={18} />}
                    </div>
                  </button>
                  <div className={`faq-content-luxury ${activeProtocolIndex === index ? 'expanded' : ''}`}>
                    <div className="faq-inner-luxury">
                      {protocol.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTACT BLOCK */}
            <div className="contact-prompt-luxury mt-16">
              <h3 className="subtitle-serif-small mb-4 font-mono uppercase">UNRESOLVED_INQUIRY?</h3>
              <p className="text-muted mb-8 font-mono xsmall">
                If your specific system requirement is not addressed, establish a direct link with the central registry.
              </p>

              <a href="mailto:omnorainfo28@gmail.com" className="btn-luxury-outline font-mono xsmall uppercase">
                <Terminal size={16} style={{ marginRight: '8px' }} /> INITIATE_REGISTRY_UPLINK
              </a>

              <div className="concierge-meta mt-8 font-mono xsmall">
                CENTRAL_LINE: +92 3334355475 <br />
                (MON-SAT, 1100 - 2100 PKT)
              </div>
            </div>
          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
}