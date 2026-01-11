import React, { useEffect, useRef } from 'react';
import { 
  Gamepad, 
  Bot, 
  Laptop, 
  Brush, 
  Sprout, 
  Lightbulb, 
  BookOpen, 
  Handshake, 
  Globe, 
  ArrowLeft, 
  UserCircle // <--- Added this
} from 'lucide-react';import './About.css';

// Import the image directly if it's in src/assets
// If it's in public, use "/images/me.png"
import founderImg from '../assets/ingredients/me.png'; 

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
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
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
      <div className="noise-layer"></div>

      {/* Optional: Back Button Integration */}
      {/* <button onClick={onBack} className="back-btn-absolute"><ArrowLeft size={24} /></button> */}

      <div className="about-container">
        
        {/* --- HERO SECTION --- */}
        <section className="about-hero">
          <div className="hero-super-title">OMNORA</div>
          <h1 className="section-header-magnum">
            We Are The <br />
            <span className="highlight-cyan">Revolution.</span>
          </h1>
          <p className="text-editorial">
            Fueled by ethical AI, cinematic creativity, and a relentless passion for the future.
            We don't just follow trends; we engineer the void.
          </p>
        </section>

        {/* --- THE VISION (Animated) --- */}
        <div ref={addToRefs} className="reveal-block">
          <h2 className="section-header-magnum">The Vision</h2>
          <p className="text-editorial">
            Omnora Store is a digital powerhouse born from the mind of <span className="highlight-gold">Ahmad Mahboob</span>.
            We merge the tactile world of luxury with the boundless potential of Game Dev and AI.
          </p>
        </div>

        {/* --- MISSION STATEMENT --- */}
        <div ref={addToRefs} className="reveal-block mt-section">
          <div className="mission-blockquote">
            <h2 className="mission-header">Our Mission</h2>
            <p className="mission-quote">
              "To generate revenue through <span className="highlight-cyan">ethical, high-impact ventures</span>—mastering AI innovation and game development—while proving that age is merely a number, not a limit."
            </p>
          </div>
        </div>

        {/* --- CAPABILITIES (Tech Grid) --- */}
        <div ref={addToRefs} className="reveal-block mt-section">
          <h2 className="section-header-magnum">Capabilities</h2>
          <div className="tech-grid">
            {[
              { icon: Gamepad, title: 'Game Development', desc: 'Immersive 3D worlds and mechanics built in Unity & Unreal Engine.' },
              { icon: Bot, title: 'AI Solutions', desc: 'Automation tools and intelligent systems that solve real-world friction.' },
              { icon: Laptop, title: 'Web Architecture', desc: 'High-performance React & Next.js applications with cinematic UI.' },
              { icon: Brush, title: 'Visual Design', desc: 'Cyberpunk aesthetics, high-fidelity branding, and digital art.' }
            ].map((item, idx) => (
              <div key={idx} className="tech-card">
                <item.icon className="tech-icon" size={32} />
                <h3 className="tech-title">{item.title}</h3>
                <p className="tech-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- FOUNDER SPOTLIGHT --- */}
        <div ref={addToRefs} className="reveal-block mt-section">
          <div className="founder-section">
            <div className="founder-header">
              <div 
                className="founder-avatar" 
                style={{ 
                  backgroundImage: `url(${founderImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Fallback if image fails or generic icon needed */}
                {!founderImg && <UserCircle size={40} />} 
              </div>
              <div className="founder-info">
                <h3 className="founder-name">Ahmad Mahboob</h3>
                <span className="founder-role">Founder & Digital Architect • 20 Years Old</span>
              </div>
            </div>
            
            <p className="text-editorial">
              I am the Founder of Omnora. A 20-year-old entrepreneur, developer, and digital media specialist with over 5 years of experience. 
              <br /><br />
              My goal is simple: To build systems that matter. From self-care products to software architecture, I believe in quality, ethics, and <span className="highlight-gold">absolute excellence.</span>
            </p>
          </div>
        </div>

        {/* --- CORE VALUES --- */}
        <div ref={addToRefs} className="reveal-block mt-section">
          <h2 className="section-header-magnum">The Core Code</h2>
          <div className="values-list">
            {[
              { icon: Sprout, text: 'Growth through mastery, not just degrees.' },
              { icon: Lightbulb, text: 'Simplicity and clarity in every creation.' },
              { icon: BookOpen, text: 'Relentless learning, constant evolution.' },
              { icon: Handshake, text: 'Uncompromised ethics in business.' },
              { icon: Globe, text: 'Building a legacy that inspires.' }
            ].map((item, idx) => (
              <div key={idx} className="value-row">
                <item.icon className="highlight-cyan value-icon" size={24} />
                <span className="value-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- CTA --- */}
        <div ref={addToRefs} className="reveal-block cta-section">
          <h2 className="section-header-magnum">Shape The Future</h2>
          <p className="text-editorial center-text">
            Whether you're a creator, a visionary, or just curious—join us to build something extraordinary.
          </p>
          
          <a href="mailto:pakahmad9815@gmail.com" className="btn-neon">
            Initiate Contact
          </a>
          
          <div className="contact-sub">
            For inquiries: <a href="mailto:omnorainfo28@gmail.com" className="contact-link-neon">omnorainfo28@gmail.com</a>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <footer className="footer-magnum">
          <img src="/images/omnora labs.png" alt="Omnora Labs" />
          <p className="copyright">&copy; 2025 Omnora Labs. All Rights Reserved.</p>
        </footer>

      </div>
    </div>
  );
};

export default AboutComponent;