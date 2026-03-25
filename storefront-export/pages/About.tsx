/**
 * 🛠️ OMNORA LABS | KERNEL SPECIFICATIONS (ABOUT MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "The architecture defines the boundary of the possible."
 * ---------------------------------------------------------
 */

import React, { useEffect, useRef } from 'react';
import {
  Zap,
  Cpu,
  ShieldCheck,
  Database,
  ArrowRight,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import './About.css';

const AboutComponent: React.FC = () => {
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const currentRefs = revealRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach(ref => { if (ref) observer.unobserve(ref); });
      observer.disconnect();
    };
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="about-luxury">
      {/* --- HERO --- */}
      <section className="about-hero-section">
        <div className="container hero-content reveal" ref={addToRefs}>
          <span className="eyebrow font-mono" style={{ letterSpacing: '4px' }}>ARCHITECTURAL_GENESIS</span>
          <h1 className="h1 editorial-title font-mono uppercase">
            The Logic of <br />
            <span className="font-serif italic text-royal">Universal Systems</span>
          </h1>
          <p className="description font-mono xsmall">
            Born from a legacy of high-performance engineering, Omnora Labs is more than a commerce engine.
            It is a celebration of modular infrastructure—robust, scalable, and gracefully rooted in industrial standards.
          </p>
        </div>
      </section>

      {/* --- VISION --- */}
      <section className="section-padding container">
        <div className="vision-grid reveal" ref={addToRefs}>
          <div className="vision-image-wrapper">
            <img src="/images/home/formal.png" alt="System Node" className="vision-img" />
            <div className="img-overlay-gold" style={{ background: 'linear-gradient(45deg, rgba(30, 58, 138, 0.1), transparent)' }} />
          </div>
          <div className="vision-text">
            <h2 className="h2 subtitle-serif font-mono uppercase xsmall" style={{ fontWeight: 800 }}>KERNEL_VISION_STATEMENT</h2>
            <div className="accent-bar" style={{ background: 'var(--royal-blue)' }} />
            <p className="text-muted font-mono xsmall">
              Founded with the goal of redefining global commerce, we merge traditional transactional logic
              with contemporary modular components. Every node is chosen for its efficiency, every pipeline placed with intention.
            </p>
            <p className="text-muted mt-4 font-mono xsmall">
              From high-performance edge clusters to distributed system registries, we deliver the finest
              infrastructure engineered for global scale and infinite modification.
            </p>
          </div>
        </div>
      </section>

      {/* --- VALUES --- */}
      <section className="section-padding bg-blush" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="section-header reveal" ref={addToRefs}>
            <h2 className="h2 subtitle-serif font-mono uppercase">CORE_PHILOSOPHIES</h2>
            <p className="text-royal font-mono xsmall italic uppercase">SURGICAL_PRECISION_IN_EVERY_MODULE</p>
          </div>

          <div className="values-grid">
            {[
              { icon: Activity, title: 'ALGORITHMIC_PRECISION', desc: 'Optimized logic gates and low-latency pipelines that ensure maximum throughput.' },
              { icon: Layers, title: 'MODULAR_SCALABILITY', desc: 'Atomic design patterns and distributed state management designed for horizontal expansion.' },
              { icon: Database, title: 'SYSTEMIC_LONGEVITY', desc: 'Aesthetic infrastructure designed to transcend trends and maintain operational integrity.' },
              { icon: ShieldCheck, title: 'ZERO_TRUST_INTEGRITY', desc: 'Enterprise-grade encryption and isolated execution environments for secure asset distribution.' }
            ].map((item, idx) => (
              <div key={idx} className="value-card reveal-up" ref={addToRefs}>
                <item.icon className="text-royal mb-4" size={32} strokeWidth={1.5} />
                <h3 className="font-mono font-bold uppercase xsmall letter-spacing-wide mb-2" style={{ color: 'var(--royal-blue)' }}>{item.title}</h3>
                <p className="text-muted font-mono xsmall" style={{ fontSize: '0.7rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- THE ARCHITECT --- */}
      <section className="section-padding container">
        <div className="founder-editorial reveal" ref={addToRefs}>
          <div className="founder-text">
            <span className="eyebrow text-royal font-mono">LEADERSHIP_PROTOCOL</span>
            <h2 className="h2 subtitle-serif font-mono uppercase">Ahmad Mahboob</h2>
            <span className="role-tag font-mono xsmall">Principal Architect & Founder</span>
            <p className="text-muted mt-6 font-mono xsmall italic">
              "Logic is the highest form of creative expression. With Omnora Labs,
              I have engineered a space where industrial power is accessible through a surgical lens, and infrastructure is celebrated as art."
            </p>
          </div>
          <div className="founder-image">
            <img src="/assets/ingredients/me.png" alt="Ahmad Mahboob" className="founder-portrait" />
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="section-padding text-center border-t">
        <div className="container reveal" ref={addToRefs}>
          <h3 className="h3 subtitle-serif font-mono uppercase">INITIATE_ECOSYSTEM_INTEGRATION</h3>
          <p className="text-muted mb-12 max-w-md mx-auto font-mono xsmall">
            Synchronize with our primary data stream for kernel updates and hardware-level system previews.
          </p>
          <div className="cta-actions">
            <a href="mailto:omnorainfo28@gmail.com" className="btn btn-luxury inline-flex items-center font-mono">
              INITIATE_UPLINK <ArrowRight size={16} className="ml-2" />
            </a>
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
};

export default AboutComponent;
t;