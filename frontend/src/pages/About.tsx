import React, { useEffect, useRef } from 'react';
import {
  Heart,
  Feather,
  Clock,
  ShieldCheck,
  Globe,
  ArrowRight
} from 'lucide-react';
import './About.css';

interface AboutComponentProps {
  onBack: () => void;
}

const AboutComponent: React.FC<AboutComponentProps> = ({ onBack }) => {
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
          <span className="eyebrow">OUR STORY</span>
          <h1 className="h1 editorial-title">
            The Art of <br />
            <span className="font-serif italic text-gold">Pakistani Elegance</span>
          </h1>
          <p className="description">
            Born from a legacy of fine craftsmanship, Gold She Garments is more than a fashion house.
            It is a celebration of the modern woman—confident, timeless, and gracefully rooted in heritage.
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
            <h2 className="h2 subtitle-serif">The Atelier Vision</h2>
            <div className="accent-bar" />
            <p className="text-muted">
              Founded with the goal of redefining Pakistani ready-to-wear, we merge traditional artisanal techniques
              with contemporary silhouettes. Every thread is chosen for its quality, every stitch placed with intention.
            </p>
            <p className="text-muted mt-4">
              From the bustling looms of Faisalabad to the intricate embroidery of Multan, we bring you the finest
              fabrics that Pakistan has to offer, tailored for the global stage.
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
              { icon: Heart, title: 'Passion for Craft', desc: 'Hand-dyed fabrics and hand-finished embroidery that tells a story.' },
              { icon: Feather, title: 'Uncompromised Comfort', desc: 'Lightweight, breathable premium cottons and chiffons designed for seasonal ease.' },
              { icon: Clock, title: 'Timeless Design', desc: 'Aesthetic pieces that transcend trends and celebrate longevity.' },
              { icon: ShieldCheck, title: 'Ethical Production', desc: 'Fair wages and safe environments for our master artisans.' }
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
              "I believe that fashion is the most intimate form of self-expression. With Gold She Garments,
              I wanted to create a space where luxury is accessible, and tradition is celebrated through a modern lens."
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
          <h3 className="h3 subtitle-serif mb-8">Join the Gold She Circle</h3>
          <p className="text-muted mb-12 max-w-md mx-auto small">
            Stay updated with our latest seasonal collections and exclusive atelier previews.
          </p>
          <div className="cta-actions">
            <a href="mailto:omnorainfo28@gmail.com" className="btn btn-luxury inline-flex items-center">
              Inquire Now <ArrowRight size={16} className="ml-2" />
            </a>
          </div>
        </div>
      </section>

      <footer className="footer-luxury section-padding">
        <div className="container text-center">
          <span className="footer-logo">GOLD SHE GARMENTS</span>
          <p className="copyright">&copy; 2025 GSG Atelier. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutComponent;