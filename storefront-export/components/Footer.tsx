/**
 * 🛠️ OMNORA LABS | SYSTEM TERMINATION (FOOTER MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "The end is merely the foundation for the next iteration."
 * ---------------------------------------------------------
 */

import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, ArrowRight, Loader2, ShieldCheck, Terminal, Cpu, Database } from 'lucide-react';
import { useState } from 'react';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import './Footer.css';

export default function Footer() {
    const [protocolEmail, setProtocolEmail] = useState('');
    const [streamStatus, setStreamStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [faultMessage, setFaultMessage] = useState('');

    const executeSubscriptionProtocol = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!protocolEmail) return;

        setStreamStatus('loading');
        OmnoraLogger.info(`Initiating subscription protocol for node: ${protocolEmail}`);

        // Simulated asynchronous stream committal
        setTimeout(() => {
            setStreamStatus('success');
            OmnoraLogger.info("Subscription protocol committed successfully.");
            setTimeout(() => {
                setStreamStatus('idle');
                setProtocolEmail('');
                setFaultMessage('');
            }, 3000);
        }, 1500);
    };

    return (
        <footer className="footer-enhanced">
            <div className="footer-glow-line"></div>

            <div className="footer-container footer-grid-enhanced">
                {/* 1. KERNEL_IDENTITY */}
                <div className="footer-brand-col">
                    <Link to="/" className="footer-logo">
                        <div className="logo-icon-box">
                            <span className="font-mono" style={{
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                color: 'var(--royal-blue)',
                                textTransform: 'uppercase',
                                letterSpacing: '4px'
                            }}>
                                OMNORA
                            </span>
                        </div>
                    </Link>
                    <p className="footer-desc">
                        The Universal Commerce OS. High-performance, multi-tenant storefront engine for global asset distribution.
                        Built for speed, scale, and infinite modification.
                        <br />
                        <span className="font-mono xsmall" style={{ opacity: 0.5 }}>KERNEL_BUILD: v1.4.0-STABLE</span>
                    </p>

                    <div className="subsidiary-badge">
                        <Cpu size={12} />
                        <span className="badge-value font-mono">OMNORA_LABS_DIVISION</span>
                    </div>
                </div>

                {/* 2. REGISTRY_ARCHIVES */}
                <div className="footer-links-col">
                    <h4 className="font-mono xsmall uppercase">REGISTRY_ARCHIVES</h4>
                    <nav>
                        <Link to="/collection" className="footer-link font-mono xsmall">ASSET_CATALOG</Link>
                        <Link to="/collection?category=digital" className="footer-link font-mono xsmall">DIGITAL_NODES</Link>
                        <Link to="/collection?category=physical" className="footer-link font-mono xsmall">PHYSICAL_UNITS</Link>
                        <Link to="/collection?category=modular" className="footer-link font-mono xsmall">MODULAR_UNITS</Link>
                        <Link to="/about" className="footer-link font-mono xsmall">ARCHITECTURAL_SPECS</Link>
                    </nav>
                </div>

                {/* 3. UPLINK_SUPPORT */}
                <div className="footer-links-col">
                    <h4 className="font-mono xsmall uppercase">UPLINK_SUPPORT</h4>
                    <nav>
                        <Link to="/contact" className="footer-link font-mono xsmall">INITIATE_UPLINK</Link>
                        <Link to="/shipping" className="footer-link font-mono xsmall">LOGISTICS_PROTOCOL</Link>
                        <Link to="/returns" className="footer-link font-mono xsmall">DECOMMISSION_FLOW</Link>
                        <Link to="/builder/help" className="footer-link font-mono xsmall">BOOT_GUIDE</Link>
                        <Link to="/privacy" className="footer-link font-mono xsmall">PRIVACY_ENCRYPTION</Link>
                        <Link to="/terms" className="footer-link font-mono xsmall">SERVICE_COMMITTAL</Link>
                    </nav>
                </div>

                {/* 4. KERNEL_SUBSCRIPTION */}
                <div className="footer-newsletter-col">
                    <h4 className="font-mono xsmall uppercase">KERNEL_SUBSCRIPTION</h4>
                    <p className="newsletter-text">Subscribe to the primary data stream for architectural updates and registry expansions.</p>

                    <form onSubmit={executeSubscriptionProtocol} className="footer-subscribe-form">
                        <div className={`input-group ${streamStatus}`}>
                            <input
                                type="email"
                                placeholder="NODE_ADDRESS@STORAGE.SYS"
                                className="font-mono"
                                value={protocolEmail}
                                onChange={(e) => setProtocolEmail(e.target.value)}
                                disabled={streamStatus === 'loading' || streamStatus === 'success'}
                            />
                            <button type="submit" disabled={streamStatus === 'loading' || streamStatus === 'success'}>
                                {streamStatus === 'loading' ? <Loader2 className="animate-spin" size={18} /> :
                                    streamStatus === 'success' ? <span style={{ color: 'var(--success)' }}>✓</span> :
                                        <ArrowRight size={18} />}
                            </button>
                        </div>
                        {streamStatus === 'error' && <span className="status-msg error font-mono">{faultMessage}</span>}
                        {streamStatus === 'success' && <span className="status-msg success font-mono uppercase xsmall">PROTOCOL_ESTABLISHED</span>}
                    </form>

                    <div className="social-links">
                        <a href="https://instagram.com" className="social-icon" aria-label="Instagram"><Instagram size={18} /></a>
                        <a href="https://twitter.com" className="social-icon" aria-label="Twitter"><Twitter size={18} /></a>
                        <a href="https://github.com/ahmad-labs" className="social-icon" aria-label="GitHub"><Terminal size={18} /></a>
                    </div>
                </div>
            </div>

            {/* TERMINATION_BAR */}
            <div className="footer-bottom-bar">
                <div className="footer-container bottom-flex">
                    <div className="copyright font-mono xsmall">
                        © {new Date().getFullYear()} OMNORA_LABS_KERNEL. ALL SYSTEM_RIGHTS_RESERVED.
                    </div>
                    <div className="credits font-mono xsmall">
                        <Database size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        EXECUTED_ON <span className="dev-name">OMNORA.OS.V1</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

}