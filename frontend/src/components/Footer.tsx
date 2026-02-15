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
                            <span style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                color: 'var(--royal-blue)',
                                textTransform: 'uppercase'
                            }}>
                                Gold She
                            </span>
                        </div>
                    </Link>
                    <p className="footer-desc">
                        Premium Pakistani fashion for the modern woman.
                        Blending traditional craftsmanship with contemporary elegance.
                        <br />
                        <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>MADE WITH PRIDE IN PAKISTAN</span>
                    </p>

                    <div className="subsidiary-badge">
                        <span className="badge-label">BRAND BY</span>
                        <span className="badge-value">GOLD SHE GARMENTS</span>
                    </div>
                </div>

                {/* 2. EXPLORE COLUMN */}
                <div className="footer-links-col">
                    <h4>Collections</h4>
                    <nav>
                        <Link to="/collection" className="footer-link">New Arrivals</Link>
                        <Link to="/collection?category=unstitched" className="footer-link">Unstitched</Link>
                        <Link to="/collection?category=stitched" className="footer-link">Ready-to-Wear</Link>
                        <Link to="/collection?category=formal" className="footer-link">Formal Wear</Link>
                        <Link to="/about" className="footer-link">Our Story</Link>
                    </nav>
                </div>

                {/* 3. LEGAL COLUMN */}
                <div className="footer-links-col">
                    <h4>Customer Care</h4>
                    <nav>
                        <Link to="/contact" className="footer-link">Contact Us</Link>
                        <Link to="/shipping" className="footer-link">Shipping Information</Link>
                        <Link to="/size-guide" className="footer-link">Size Guide</Link>
                        <Link to="/returns" className="footer-link">Returns & Exchange</Link>
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
                        {status === 'success' && <span className="status-msg success">Welcome to Gold She Garments!</span>}
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
                        © {new Date().getFullYear()} GOLD SHE GARMENTS. ALL RIGHTS RESERVED.
                    </div>
                    <div className="credits">
                        POWERED BY <span className="dev-name">GSG DIGITAL</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}