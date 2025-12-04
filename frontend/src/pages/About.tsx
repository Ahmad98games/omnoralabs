import React, { useEffect, useRef } from 'react';
import { ChevronLeft, Gamepad, Bot, Laptop, Brush, Sprout, Lightbulb, BookOpen, Handshake, Globe, UserCircle } from 'lucide-react';
import './About.css';

interface AboutComponentProps {
  onBack: () => void;
}

const AboutComponent: React.FC<AboutComponentProps> = ({ onBack }) => {
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      },
      { threshold: 0.2 }
    );

    revealRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <div className="about-page">
      <section className="about-container">
        <div className="bg-pattern-about"></div>

        {/* Intro */}
        <div className="about-intro">
          <h1 className="section-header-about about-title">
            About Omnora
          </h1>
          <p className="about-subtitle">
            We're not just a company—we're a movement. Fueled by ethical AI, bold creativity, and a passion for building a better tomorrow.
          </p>
        </div>

        {/* Who We Are */}
        <div ref={addToRefs} className="reveal-about grid-cols-1">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="section-header-about">Who We Are</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '1.125rem' }}>
              Omnora is a digital powerhouse born from the vision of <span className="highlight-text">Ahmad Mahboob</span>, driving innovation through game development, AI solutions, and digital excellence.
            </p>
          </div>
        </div>

        {/* Our Mission */}
        <div ref={addToRefs} className="reveal-about section-mb">
          <h2 className="section-header-about text-center w-full">Our Mission</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', fontSize: '1.125rem', maxWidth: '768px', margin: '0 auto', textAlign: 'center' }}>
            We aim to generate <span className="highlight-text">$100K–$200K</span> annually through ethical, halal ventures—think AI innovation, game development, and digital mastery—all while inspiring our generation to turn skills into impact.
          </p>
        </div>

        {/* What We Do */}
        <div ref={addToRefs} className="reveal-about section-mb">
          <h2 className="section-header-about text-center w-full mb-2">What We Do</h2>
          <div className="grid-cards">
            {[
              { icon: Gamepad, title: 'Game Development', desc: 'From 3D endless runners to bubble shooters—mobile games that captivate.' },
              { icon: Bot, title: 'AI Solutions', desc: 'Automation tools and digital products that solve real problems.' },
              { icon: Laptop, title: 'Web & Design', desc: 'Stunning sites, dashboards, and 3D visuals that stand out.' },
              { icon: Brush, title: 'Graphics Design', desc: 'Stunning design, thumbnails, logos, and banners that stand out.' }
            ].map((item, idx) => (
              <div key={idx} className="card-about">
                <item.icon size={48} color="var(--aqua-400)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div ref={addToRefs} className="reveal-about section-mb">
          <h2 className="section-header-about text-center w-full mb-2">Our Core Values</h2>
          <div className="grid-values">
            {[
              { icon: Sprout, text: 'Growth through skills, not just degrees.' },
              { icon: Lightbulb, text: 'Simplicity and clarity in every creation.' },
              { icon: BookOpen, text: 'Always learning, always innovating.' },
              { icon: Handshake, text: 'Ethics and respect in all we do.' },
              { icon: Globe, text: 'Impact that inspires the next gen.' }
            ].map((item, idx) => (
              <div key={idx} className="value-item">
                <item.icon size={32} color="var(--aqua-400)" style={{ flexShrink: 0 }} />
                <p style={{ color: 'var(--text-primary)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meet the Founders */}
        <div ref={addToRefs} className="reveal-about section-mb">
          <h2 className="section-header-about text-center w-full mb-2">Meet the Founders</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="card-about founder-card">
              <div className="founder-header">
                <div className="founder-icon">
                  <UserCircle size={32} />
                </div>
                <div className="founder-info">
                  <h3>Ahmad Mahboob</h3>
                  <p>Founder • 18 Years Old</p>
                </div>
              </div>
              <p className="founder-bio">
                A dreamer and doer, Ahmad's skills in game dev, AI, and design fuel Omnora's bold vision. He's all about action and impact. Solo Developed 3 Games in unity and multiple websites if it is Front end or back end. We are proud of our skills and we are ready to take over the world with our skills.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div ref={addToRefs} className="reveal-about text-center section-mb">
          <h2 className="section-header-about text-center w-full" style={{ marginBottom: '1.5rem' }}>Let's Shape the Future</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '672px', margin: '0 auto 2rem', fontSize: '1.125rem' }}>
            Whether you're a creator, a visionary, or just curious—join us to build something extraordinary.
          </p>
          <a href="mailto:pakahmad9815@gmail.com" className="btn-custom-about" style={{ marginBottom: '1.5rem' }}>
            Get in Touch
          </a>
          <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            For more information, please email us at <a href="mailto:omnorainfo28@gmail.com" className="contact-link">omnorainfo28@gmail.com</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutComponent;