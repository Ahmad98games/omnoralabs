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
    storeName?: string;
    storeDescription?: string;
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    columns?: FooterColumn[];
    socialLinks?: SocialLink[];
    showPaymentIcons?: boolean;
    copyrightText?: string;
    /** Phase 17: Dynamic nav menu from DatabaseClient */
    navMenu?: { label: string; url: string }[];
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
    storeName = 'Omnora',
    storeDescription = 'Premium curated goods for the modern connoisseur. Crafted with passion, delivered with care.',
    bgColor = '#0a0a12',
    textColor = '#e8e8f0',
    accentColor = '#7c6dfa',
    columns = DEFAULT_COLUMNS,
    socialLinks = DEFAULT_SOCIALS,
    showPaymentIcons = true,
    copyrightText = `© ${new Date().getFullYear()} Omnora. All rights reserved.`,
    navMenu,
}) => {
    // If navMenu is provided, create a "Navigation" column from it and prepend
    const resolvedColumns: FooterColumn[] = navMenu && navMenu.length > 0
        ? [{ title: 'Navigation', links: navMenu }, ...columns]
        : columns;
    return (
        <footer
            data-node-id={nodeId}
            style={{
                background: bgColor, color: textColor,
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '48px 40px 24px',
            }}
        >
            {/* Main Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `1.4fr ${resolvedColumns.map(() => '1fr').join(' ')}`,
                gap: 40,
                marginBottom: 40,
            }}>
                {/* Brand Column */}
                <div>
                    <h3 style={{
                        fontSize: 20, fontWeight: 900, margin: '0 0 12px',
                        letterSpacing: '-0.03em', color: textColor,
                    }}>
                        {storeName}
                    </h3>
                    <p style={{
                        fontSize: 12, color: T.textDim, lineHeight: 1.7,
                        margin: '0 0 20px', maxWidth: 260,
                    }}>
                        {storeDescription}
                    </p>

                    {/* Social Icons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {socialLinks.map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                                width: 34, height: 34, borderRadius: 8,
                                background: `${accentColor}12`,
                                border: `1px solid ${accentColor}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: accentColor, fontSize: 13, fontWeight: 800,
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                            }}>
                                {SOCIAL_ICONS[s.platform] || s.platform.charAt(0)}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Link Columns */}
                {resolvedColumns.map((col, i) => (
                    <div key={i}>
                        <h4 style={{
                            fontSize: 11, fontWeight: 700, color: T.textMuted,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            margin: '0 0 16px',
                        }}>
                            {col.title}
                        </h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {col.links.map((link, j) => (
                                <li key={j}>
                                    <a href={link.url} style={{
                                        fontSize: 13, color: T.textDim,
                                        textDecoration: 'none', fontWeight: 500,
                                        transition: 'color 0.15s',
                                    }}
                                        onMouseEnter={e => { (e.target as HTMLElement).style.color = accentColor; }}
                                        onMouseLeave={e => { (e.target as HTMLElement).style.color = T.textDim; }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: T.border, marginBottom: 20 }} />

            {/* Bottom Row */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16,
            }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>
                    {copyrightText}
                </span>

                {showPaymentIcons && (
                    <div style={{ display: 'flex', gap: 6 }}>
                        {PAYMENT_ICONS.map(p => (
                            <span key={p} style={{
                                padding: '4px 10px', borderRadius: 4,
                                background: '#14142a', border: `1px solid ${T.border}`,
                                fontSize: 9, fontWeight: 700, color: T.textDim,
                                letterSpacing: '0.04em',
                            }}>
                                {p}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </footer>
    );
};

export default SiteFooter;
