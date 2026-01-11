import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
// import client from '../api/client'; // Uncomment this when API is ready
import './Footer.css'; // Don't forget this!

export default function Footer() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        // Simulating API call for now (Replace with your actual client call)
        setTimeout(() => {
            // Success Logic
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setEmail('');
                setMessage('');
            }, 3000);
        }, 1500);

        /* try {
            await client.post('/newsletter', { email });
            setStatus('success');
            // ... reset logic
        } catch (error) {
            setStatus('error');
            setMessage('Transmission Failed');
        }
        */
    };

    return (
        <footer className="footer-enhanced">
            {/* Top Border Glow */}
            <div className="footer-glow-line"></div>

            <div className="footer-container footer-grid-enhanced">

                {/* 1. BRAND COLUMN */}
                <div className="footer-brand-col">
                    <Link to="/" className="footer-logo">
                        <div className="logo-icon-box">
                            <img src="/images/omnora store.png" alt="Omnora Store" style={{ height: '32px', objectFit: 'contain' }} />
                        </div>
                    </Link>
                    <p className="footer-desc">
                        Curating artifacts for the modern sanctuary. Where precision meets cyberpunk aesthetics.
                        <br />
                        <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>// HANDCRAFTED IN LAHORE</span>
                    </p>

                    <div className="subsidiary-badge">
                        <span className="badge-label">OPERATED BY</span>
                        <span className="badge-value">OMNORA LABS INC.</span>
                    </div>
                </div>

                {/* 2. EXPLORE COLUMN */}
                <div className="footer-links-col">
                    <h4>Navigation</h4>
                    <nav>
                        <Link to="/collection" className="footer-link">Shop Collection</Link>
                        <Link to="/about" className="footer-link">About Us</Link>
                        <Link to="/contact" className="footer-link">Support Hub</Link>
                        <Link to="/tech" className="footer-link">Tech Architecture</Link>
                    </nav>
                </div>

                {/* 3. LEGAL COLUMN */}
                <div className="footer-links-col">
                    <h4>Legal Protocols</h4>
                    <nav>
                        <Link to="/terms" className="footer-link">Terms of Service</Link>
                        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                        <Link to="/shipping" className="footer-link">Shipping & Returns</Link>
                        <Link to="/refunds" className="footer-link">Refund Policy</Link>
                    </nav>
                </div>

                {/* 4. NEWSLETTER & CONNECT */}
                <div className="footer-newsletter-col">
                    <h4>Stay Connected</h4>
                    <p className="newsletter-text">Join the inner circle. Exclusive drops and system updates.</p>

                    <form onSubmit={handleSubscribe} className="footer-subscribe-form">
                        <div className={`input-group ${status}`}>
                            <input
                                type="email"
                                placeholder="ENTER YOUR EMAIL"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                            />
                            <button type="submit" disabled={status === 'loading' || status === 'success'}>
                                {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> :
                                    status === 'success' ? <span style={{ color: '#00ff88' }}>✓</span> :
                                        <ArrowRight size={18} />}
                            </button>
                        </div>
                        {status === 'error' && <span className="status-msg error">{message}</span>}
                        {status === 'success' && <span className="status-msg success">Signal Received. Welcome aboard.</span>}
                    </form>

                    <div className="social-links">
                        <a href="https://instagram.com" className="social-icon" aria-label="Instagram"><Instagram size={18} /></a>
                        <a href="https://twitter.com" className="social-icon" aria-label="Twitter"><Twitter size={18} /></a>
                        <a href="https://facebook.com" className="social-icon" aria-label="Facebook"><Facebook size={18} /></a>
                    </div>
                </div>
            </div>

            {/* BOTTOM BAR */}
            <div className="footer-bottom-bar">
                <div className="footer-container bottom-flex">
                    <div className="copyright">
                        © {new Date().getFullYear()} OMNORA LABS. ALL RIGHTS RESERVED.
                    </div>
                    <div className="credits">
                        ENGINEERED BY <span className="dev-name">AHMAD MAHBOOB</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}