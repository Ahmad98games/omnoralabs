/**
 * SiteFooter: Comprehensive Store Footer
 *
 * Multi-column link groups, social icons, payment badges, copyright.
 * Responsive stacking on mobile viewports.
 * Registered in BuilderRegistry as 'site_footer'.
 */
import React from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface FooterLink {
    label: string;
    url: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface SocialLink {
    platform: string;
    url: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SiteFooterProps {
    nodeId: string;
    isBuilder?: boolean;
    columns?: FooterColumn[];
    maxColumns?: number;
    logoSrc?: string;
    logoAlt?: string;
    tagline?: string;
    socialLinks?: SocialLink[];
    showNewsletter?: boolean;
    newsletterHeading?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    copyrightText?: string;
    backgroundColor?: string;
    textColor?: string;
    linkHoverColor?: string;
    dividerColor?: string;
    paddingY?: number;
    children?: React.ReactNode;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS: FooterColumn[] = [
    {
        title: 'Shop', links: [
            { label: 'New Arrivals', url: '#' }, { label: 'Best Sellers', url: '#' },
            { label: 'Collections', url: '#' }, { label: 'Gift Cards', url: '#' },
        ]
    },
    {
        title: 'Help', links: [
            { label: 'Contact Us', url: '#' }, { label: 'FAQs', url: '#' },
            { label: 'Shipping Info', url: '#' }, { label: 'Returns', url: '#' },
        ]
    },
    {
        title: 'Company', links: [
            { label: 'About Us', url: '#' }, { label: 'Careers', url: '#' },
            { label: 'Press', url: '#' }, { label: 'Blog', url: '#' },
        ]
    },
];

const DEFAULT_SOCIALS: SocialLink[] = [
    { platform: 'Twitter', url: '#' },
    { platform: 'Instagram', url: '#' },
    { platform: 'Facebook', url: '#' },
    { platform: 'YouTube', url: '#' },
];

const SOCIAL_ICONS: Record<string, string> = {
    Twitter: '𝕏', Instagram: '📷', Facebook: 'f', YouTube: '▶',
    TikTok: '♪', LinkedIn: 'in', Pinterest: '📌',
};

const PAYMENT_ICONS = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay'];

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    border: '#1e1e3a',
    textDim: '#8888a8',
    textMuted: '#555570',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SiteFooter: React.FC<SiteFooterProps> = ({
    nodeId,
    isBuilder = false,
    columns = [],
    maxColumns = 3,
    logoSrc,
    logoAlt = "Logo",
    tagline = "Stay in the loop",
    socialLinks = [],
    showNewsletter = true,
    newsletterHeading = "Stay in the loop",
    newsletterPlaceholder = "Enter your email",
    newsletterButtonText = "Subscribe",
    copyrightText = `© ${new Date().getFullYear()} Your Store. All rights reserved.`,
    backgroundColor = '#0a0a12',
    textColor = '#e8e8f0',
    linkHoverColor = '#7c6dfa',
    dividerColor = '#1e1e3a',
    paddingY = 64
}) => {
    return (
        <footer
            data-node-id={nodeId}
            style={{
                background: backgroundColor, color: textColor,
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: `${paddingY}px 40px 24px`,
            }}
        >
            {/* Main Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `1.4fr repeat(${maxColumns}, 1fr) ${showNewsletter ? '1.4fr' : ''}`,
                gap: 40,
                marginBottom: 40,
            }}>
                {/* Brand Column */}
                <div>
                    {logoSrc ? (
                        <img src={logoSrc} alt={logoAlt} style={{ maxHeight: 40, marginBottom: 16 }} />
                    ) : (
                        <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 12px', color: textColor }}>
                            {logoAlt}
                        </h3>
                    )}
                    {tagline && (
                        <p style={{ fontSize: 13, color: '#8888a8', lineHeight: 1.6, margin: '0 0 20px', maxWidth: 260 }}>
                            {tagline}
                        </p>
                    )}

                    {/* Social Icons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {socialLinks.map((s, i) => (
                            <a key={i} href={isBuilder ? undefined : s.url} target="_blank" rel="noopener noreferrer" style={{
                                width: 34, height: 34, borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${dividerColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: textColor, fontSize: 14,
                                textDecoration: 'none',
                                cursor: isBuilder ? 'default' : 'pointer'
                            }}>
                                {SOCIAL_ICONS[s.platform] || s.platform.charAt(0).toUpperCase()}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Link Columns */}
                {columns.map((col, i) => (
                    <div key={i}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>
                            {col.heading || col.title}
                        </h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {col.links.map((link, j) => (
                                <li key={j}>
                                    <a href={isBuilder ? undefined : link.url} style={{
                                        fontSize: 13, color: '#8888a8',
                                        textDecoration: 'none', fontWeight: 500,
                                        transition: 'color 0.15s',
                                        cursor: isBuilder ? 'default' : 'pointer'
                                    }}
                                        onMouseEnter={e => { if (!isBuilder) (e.target as HTMLElement).style.color = linkHoverColor; }}
                                        onMouseLeave={e => { if (!isBuilder) (e.target as HTMLElement).style.color = '#8888a8'; }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {/* Newsletter Column */}
                {showNewsletter && (
                    <div>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>
                            {newsletterHeading}
                        </h4>
                        <div style={{ display: 'flex', gap: 8, maxWidth: 280 }}>
                            <input 
                                type="email" 
                                placeholder={newsletterPlaceholder} 
                                disabled={isBuilder}
                                style={{
                                    flex: 1, padding: '8px 12px', borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${dividerColor}`,
                                    color: '#fff', fontSize: 13,
                                }} 
                            />
                            <button 
                                onClick={e => isBuilder && e.preventDefault()}
                                style={{
                                    padding: '8px 16px', borderRadius: 8,
                                    background: linkHoverColor, color: '#fff',
                                    border: 'none', fontWeight: 600, fontSize: 13,
                                    cursor: isBuilder ? 'default' : 'pointer'
                                }}
                            >
                                {newsletterButtonText}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: dividerColor, marginBottom: 20 }} />

            {/* Bottom Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <span style={{ fontSize: 12, color: '#555570' }}>
                    {copyrightText}
                </span>
            </div>
        </footer>
    );
};

export default SiteFooter;
