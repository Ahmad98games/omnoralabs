/**
 * SplitHero: Image + Text Split Section
 *
 * Classic two-column layout with configurable image position,
 * CTA button, and vertical alignment. Auto-stacks on mobile.
 * Registered in BuilderRegistry as 'split_hero'.
 */
import React, { useState } from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SplitHeroProps {
    nodeId: string;
    imagePosition?: 'left' | 'right';
    imageUrl?: string;
    headline?: string;
    richText?: string;
    ctaText?: string;
    ctaLink?: string;
    ctaColor?: string;
    verticalAlignment?: 'top' | 'center' | 'bottom';
    bgColor?: string;
    height?: string;
    showCta?: boolean;
    children?: React.ReactNode;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    border: '#2a2a3a',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SplitHero: React.FC<SplitHeroProps> = ({
    nodeId,
    imagePosition = 'right',
    imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    headline = 'Crafted for the Modern Connoisseur',
    richText = 'Every piece in our collection tells a story of precision engineering and timeless design. Discover what sets us apart from the ordinary.',
    ctaText = 'Explore Collection',
    ctaLink = '#',
    ctaColor = '#7c6dfa',
    verticalAlignment = 'center',
    bgColor = '#0d0d18',
    height = 'auto',
    showCta = true,
}) => {
    const [ctaHov, setCtaHov] = useState(false);

    const alignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' } as const;

    const textContent = (
        <div style={{
            flex: 1, padding: '48px 40px',
            display: 'flex', flexDirection: 'column',
            justifyContent: alignMap[verticalAlignment],
            gap: 20, minWidth: 280,
        }}>
            <h2 style={{
                fontSize: 'clamp(24px, 3.5vw, 40px)',
                fontWeight: 900, color: T.text,
                margin: 0, lineHeight: 1.1,
                letterSpacing: '-0.04em',
            }}>
                {headline}
            </h2>

            <p style={{
                fontSize: 14, color: T.textDim,
                lineHeight: 1.8, margin: 0,
                maxWidth: 440,
            }}>
                {richText}
            </p>

            {showCta && ctaText && (
                <a
                    href={ctaLink}
                    onMouseEnter={() => setCtaHov(true)}
                    onMouseLeave={() => setCtaHov(false)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '13px 28px',
                        background: ctaHov ? ctaColor : `linear-gradient(135deg, ${ctaColor}, ${adjustBrightness(ctaColor, 25)})`,
                        border: 'none', borderRadius: 10,
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        textDecoration: 'none', letterSpacing: '0.02em',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        transform: ctaHov ? 'translateY(-2px)' : 'none',
                        boxShadow: ctaHov ? `0 8px 24px ${ctaColor}40` : `0 4px 16px ${ctaColor}20`,
                        alignSelf: 'flex-start',
                    }}
                >
                    {ctaText}
                    <span style={{ transition: 'transform 0.2s', transform: ctaHov ? 'translateX(3px)' : 'none' }}>→</span>
                </a>
            )}
        </div>
    );

    const imageContent = (
        <div style={{
            flex: 1, minWidth: 280, minHeight: 300,
            overflow: 'hidden', position: 'relative',
        }}>
            <img
                src={imageUrl}
                alt={headline}
                style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                    minHeight: 300,
                }}
            />
            {/* Gradient overlay on edge */}
            <div style={{
                position: 'absolute', inset: 0,
                background: imagePosition === 'left'
                    ? `linear-gradient(to left, ${bgColor}, transparent 30%)`
                    : `linear-gradient(to right, ${bgColor}, transparent 30%)`,
                pointerEvents: 'none',
            }} />
        </div>
    );

    return (
        <section
            data-node-id={nodeId}
            style={{
                display: 'flex',
                flexDirection: imagePosition === 'left' ? 'row' : 'row-reverse',
                background: bgColor,
                fontFamily: "'Inter', -apple-system, sans-serif",
                overflow: 'hidden',
                borderRadius: 0,
                height: height === 'auto' ? undefined : height,
                minHeight: 320,
            }}
        >
            {imageContent}
            {textContent}
        </section>
    );
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function adjustBrightness(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default SplitHero;
