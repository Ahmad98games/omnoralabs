import React, { useEffect, useRef } from 'react';
import {
  Heart,
  Feather,
  Clock,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import './About.css';

interface AboutComponentProps {
  onBack: () => void;
}

const AboutComponent: React.FC<AboutComponentProps> = ({ onBack: _onBack }) => {
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Defensive IntersectionObserver
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
          <span className="eyebrow">OUR VISION</span>
          <h1 className="h1 editorial-title">
            The Omnora <br />
            <span className="font-serif italic text-gold">Universal Kernel</span>
          </h1>
          <p className="description">
            Engineered for high-fidelity commerce and global scale, Omnora Labs is the division behind the world&apos;s most modular commerce OS.
            We don&apos;t just build stores; we build the infrastructure for the next generation of digital distribution.
          </p>
        </div>
      </section>

      {/* --- VISION --- */}
      <section className="section-padding container">
        <div className="vision-grid reveal" ref={addToRefs}>
          <div className="vision-image-wrapper">
            <img src="/images/home/formal.png" alt="Atelier" className="vision-img" />
            <div className="img-overlay-gold" />
          </div>
          <div className="vision-text">
            <h2 className="h2 subtitle-serif">The Architectural Vision</h2>
            <div className="accent-bar" />
            <p className="text-muted">
              Founded on the principle of hyper-modularity, we merge high-performance rendering with
              distributed state management. Every node is optimized for speed, every micro-animation designed for engagement.
            </p>
            <p className="text-muted mt-4">
              From our Shadow DOM-based Live Canvas to the AST Render Pipeline, we provide a sovereign
              environment for merchants who demand absolute control over their commercial territory.
            </p>
          </div>
        </div>
      </section>

      {/* --- VALUES --- */}
      <section className="section-padding bg-blush">
        <div className="container">
          <div className="section-header reveal" ref={addToRefs}>
            <h2 className="h2 subtitle-serif">Our Core Philosophies</h2>
            <p className="text-gold italic">Excellence in every detail</p>
          </div>

          <div className="values-grid">
            {[
              { icon: Heart, title: 'Architectural Purity', desc: 'No-library bloat policy for zero-latency user experiences.' },
              { icon: Feather, title: 'Hyper-Modularity', desc: 'Plug-and-play components that scale from retail to industrial use-cases.' },
              { icon: Clock, title: 'Future-Proof Tech', desc: 'Next.js 14 and Supabase-powered infrastructure that never goes obsolete.' },
              { icon: ShieldCheck, title: 'System Security', desc: 'Multi-tenant isolation and enterprise-grade RLS protection.' }
            ].map((item, idx) => (
              <div key={idx} className="value-card reveal-up" ref={addToRefs}>
                <item.icon className="text-gold mb-4" size={32} strokeWidth={1} />
                <h3 className="font-bold uppercase xsmall letter-spacing-wide mb-2">{item.title}</h3>
                <p className="text-muted xsmall">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- THE FOUNDER --- */}
      <section className="section-padding container">
        <div className="founder-editorial reveal" ref={addToRefs}>
          <div className="founder-text">
            <span className="eyebrow text-gold">LEADERSHIP</span>
            <h2 className="h2 subtitle-serif">Ahmad Mahboob</h2>
            <span className="role-tag">Founder & Creative Director</span>
            <p className="text-muted mt-6">
              &quot;Logic is the ultimate form of art. With Omnora Labs,
              I wanted to create an engine where speed is a standard, and modularity is the soul of commerce.&quot;
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
          <h3 className="h3 subtitle-serif mb-8">Deploy Your Infrastructure</h3>
          <p className="text-muted mb-12 max-w-md mx-auto small">
            Join the elite circle of merchants and developers scaling the Omnora Kernel.
          </p>
          <div className="cta-actions">
            <a href="mailto:omnorainfo28@gmail.com" className="btn btn-luxury inline-flex items-center">
              Partner with Labs <ArrowRight size={16} className="ml-2" />
            </a>
          </div>
        </div>
      </section>

      <footer className="footer-luxury section-padding">
        <div className="container text-center">
          <span className="footer-logo">OMNORA LABS</span>
          <p className="copyright">&copy; {new Date().getFullYear()} Omnora Labs. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutComponent;