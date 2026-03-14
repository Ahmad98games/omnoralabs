/**
 * HeroBanner: Fully Dynamic Hero Section
 *
 * Accepts props for headline, subheadline, background, overlay, alignment,
 * CTA button, and height. Every prop is controllable via the Builder sidebar.
 * Registered in BuilderRegistry as 'hero_banner'.
 */
import React, { useState } from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HeroBannerProps {
    nodeId: string;
    headline?: string;
    subheadline?: string;
    bgImageUrl?: string;
    bgColor?: string;
    overlayOpacity?: number;
    overlayColor?: string;
    alignment?: 'left' | 'center' | 'right';
    ctaText?: string;
    ctaLink?: string;
    ctaColor?: string;
    height?: string;
    showCta?: boolean;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const HeroBanner: React.FC<HeroBannerProps> = ({
    nodeId,
    headline = 'Elevate Your Style',
    subheadline = 'Discover our curated collection of premium timepieces, crafted for the modern connoisseur.',
    bgImageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
    bgColor = '#0a0a0f',
    overlayOpacity = 0.55,
    overlayColor = '#000000',
    alignment = 'center',
    ctaText = 'Shop Now',
    ctaLink = '#',
    ctaColor = '#7c6dfa',
    height = '70vh',
    showCta = true,
}) => {
    const [ctaHov, setCtaHov] = useState(false);

    const alignMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    } as const;

    const textAlign = alignment;
    const alignItems = alignMap[alignment];

    return (
        <section
            data-node-id={nodeId}
            style={{
                position: 'relative',
                width: '100%',
                height,
                minHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: alignItems,
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
                background: bgColor,
            }}
        >
            {/* Background Image */}
            {bgImageUrl && (
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${bgImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'transform 8s ease-out',
                }} />
            )}

            {/* Overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: overlayColor,
                opacity: overlayOpacity,
                transition: 'opacity 0.3s',
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                maxWidth: 720,
                padding: '40px 48px',
                textAlign,
                display: 'flex',
                flexDirection: 'column',
                alignItems,
                gap: 20,
            }}>
                <h1 style={{
                    fontSize: 'clamp(28px, 5vw, 56px)',
                    fontWeight: 900,
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.08,
                    letterSpacing: '-0.04em',
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}>
                    {headline}
                </h1>

                {subheadline && (
                    <p style={{
                        fontSize: 'clamp(14px, 1.5vw, 18px)',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.75)',
                        margin: 0,
                        lineHeight: 1.6,
                        maxWidth: 540,
                    }}>
                        {subheadline}
                    </p>
                )}

                {showCta && ctaText && (
                    <a
                        href={ctaLink}
                        onMouseEnter={() => setCtaHov(true)}
                        onMouseLeave={() => setCtaHov(false)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 8,
                            padding: '14px 32px',
                            background: ctaHov
                                ? ctaColor
                                : `linear-gradient(135deg, ${ctaColor}, ${adjustBrightness(ctaColor, 30)})`,
                            border: 'none',
                            borderRadius: 12,
                            color: '#ffffff',
                            fontSize: 15,
                            fontWeight: 700,
                            textDecoration: 'none',
                            letterSpacing: '0.02em',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                            transform: ctaHov ? 'translateY(-2px)' : 'translateY(0)',
                            boxShadow: ctaHov
                                ? `0 8px 30px ${ctaColor}60`
                                : `0 4px 20px ${ctaColor}30`,
                        }}
                    >
                        {ctaText}
                        <span style={{ fontSize: 16, transition: 'transform 0.2s', transform: ctaHov ? 'translateX(3px)' : 'none' }}>→</span>
                    </a>
                )}
            </div>

            {/* Bottom Gradient Fade */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: 100,
                background: `linear-gradient(transparent, ${bgColor})`,
                pointerEvents: 'none',
            }} />
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

export default HeroBanner;
