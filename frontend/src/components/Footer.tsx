import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
// import client from '../api/client'; // Uncomment this when API is ready
import './Footer.css'; // Don't forget this!
import { ROUTES } from '../routes';

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
                    <Link to={ROUTES.HOME} className="footer-logo">
                        <div className="logo-icon-box">
                            <span style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                color: 'var(--royal-blue)',
                                textTransform: 'uppercase'
                            }}>
                                Omnora
                            </span>
                        </div>
                    </Link>
                    <p className="footer-desc">
                        The Universal Commerce OS. High-performance, multi-tenant storefront engine for global asset distribution.
                        Built for speed, scale, and infinite modification.
                        <br />
                        <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>DEVELOPED BY OMNORA LABS</span>
                    </p>

                    <div className="subsidiary-badge">
                        <span className="badge-label">ENGINEERED BY</span>
                        <span className="badge-value">OMNORA LABS</span>
                    </div>
                </div>

                {/* 2. EXPLORE COLUMN */}
                <div className="footer-links-col">
                    <h4>Entities</h4>
                    <nav>
                        <Link to={ROUTES.COLLECTION} className="footer-link">Asset Catalog</Link>
                        <Link to={`${ROUTES.COLLECTION}?category=digital`} className="footer-link">Digital Nodes</Link>
                        <Link to={`${ROUTES.COLLECTION}?category=physical`} className="footer-link">Physical Units</Link>
                        <Link to={`${ROUTES.COLLECTION}?category=modular`} className="footer-link">Modular Units</Link>
                        <Link to={ROUTES.ABOUT} className="footer-link">Documentation</Link>
                    </nav>
                </div>

                {/* 3. LEGAL COLUMN */}
                <div className="footer-links-col">
                    <h4>Customer Care</h4>
                    <nav>
                        <Link to={ROUTES.CONTACT} className="footer-link">Contact Us</Link>
                        <Link to="/shipping" className="footer-link">Shipping Information</Link>
                        <Link to="/size-guide" className="footer-link">Size Guide</Link>
                        <Link to="/returns" className="footer-link">Returns & Exchange</Link>
                        <Link to={ROUTES.BUILDER_HELP} className="footer-link">Builder Guide</Link>
                        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                    </nav>
                </div>

                {/* 4. NEWSLETTER & CONNECT */}
                <div className="footer-newsletter-col">
                    <h4>Join the Community</h4>
                    <p className="newsletter-text">Subscribe for exclusive collection launches and style updates.</p>

                    <form onSubmit={handleSubscribe} className="footer-subscribe-form">
                        <div className={`input-group ${status}`}>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                            />
                            <button type="submit" disabled={status === 'loading' || status === 'success'}>
                                {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> :
                                    status === 'success' ? <span style={{ color: 'var(--success)' }}>✓</span> :
                                        <ArrowRight size={18} />}
                            </button>
                        </div>
                        {status === 'error' && <span className="status-msg error">{message}</span>}
                        {status === 'success' && <span className="status-msg success">System Access Granted. Welcome.</span>}
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
                        POWERED BY <span className="dev-name">OMNORA KERNEL</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}