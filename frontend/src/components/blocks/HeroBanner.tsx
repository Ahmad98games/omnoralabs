/**
 * HeroBanner: Fully Dynamic Hero Section
 *
 * Accepts props for headline, subheadline, background, overlay, alignment,
 * CTA button, and height. Every prop is controllable via the Builder sidebar.
 * Registered in BuilderRegistry as 'hero_banner'.
 */
import React, { useState } from 'react';
import { OmnoraImage } from '../cms/OmnoraImage';

const VideoBackground = React.memo(({ url, isBuilder }: { url: string; isBuilder: boolean }) => {
    if (isBuilder) {
        return (
            <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
                🎬 Background Video (Builder Placeholder)
            </div>
        );
    }
    return (
        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}>
            <source src={url} type="video/mp4" />
        </video>
    );
});
VideoBackground.displayName = 'VideoBackground';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HeroBannerProps {
    nodeId: string;
    isBuilder?: boolean;
    headline?: string;
    subheadline?: string;
    backgroundType?: 'color' | 'image' | 'video';
    bgColor?: string;
    imageSrc?: string;
    bgVideoUrl?: string;
    overlayOpacity?: number;
    textAlign?: 'left' | 'center' | 'right';
    minHeight?: number;
    buttonStyle?: 'filled' | 'outline' | 'ghost';
    buttonColor?: string;
    textColor?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    showCta?: boolean;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const HeroBanner: React.FC<HeroBannerProps> = ({
    nodeId,
    isBuilder = false,
    headline = 'Elevate Your Style',
    subheadline = 'Crafted for the modern connoisseur.',
    backgroundType = 'color',
    bgColor = '#f3f4f6',
    imageSrc = '',
    bgVideoUrl = '',
    overlayOpacity = 30,
    textAlign = 'center',
    minHeight = 400,
    buttonStyle = 'filled',
    buttonColor = '#7c6dfa',
    textColor = '#000000',
    ctaLabel = 'Shop Now',
    ctaUrl = '#',
    showCta = true,
}) => {
    const [ctaHov, setCtaHov] = useState(false);

    const alignMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    } as const;

    const alignItems = alignMap[textAlign];

    return (
        <section
            data-node-id={nodeId}
            style={{
                position: 'relative',
                width: '100%',
                minHeight: `${minHeight}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: alignItems,
                overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
                background: backgroundType === 'color' ? bgColor : 'transparent',
            }}
        >
            {/* Background Video */}
            {backgroundType === 'video' && bgVideoUrl && <VideoBackground url={bgVideoUrl} isBuilder={isBuilder} />}

            {/* Background Image */}
            {backgroundType === 'image' && imageSrc && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <OmnoraImage
                        src={imageSrc}
                        alt={headline || 'Hero Banner'}
                        width={1920}
                        priority={true}
                        aspectRatio="auto"
                        style={{ position: 'absolute', inset: 0, height: '100%' }}
                    />
                </div>
            )}

            {/* Overlay */}
            {backgroundType === 'image' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: '#000000',
                    opacity: overlayOpacity / 100,
                    transition: 'opacity 0.3s',
                    zIndex: 1
                }} />
            )}

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
                    fontSize: 'clamp(2rem, 5vw, 4rem)',
                    fontWeight: 900,
                    color: textColor,
                    margin: 0,
                    lineHeight: 1.08,
                    letterSpacing: '-0.04em',
                    textShadow: '0 2px 20px rgba(0,0,0,0.1)',
                }}>
                    {headline}
                </h1>

                {subheadline && (
                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        fontWeight: 400,
                        color: textColor,
                        opacity: 0.85,
                        margin: 0,
                        lineHeight: 1.6,
                        maxWidth: 540,
                    }}>
                        {subheadline}
                    </p>
                )}

                {showCta && ctaLabel && (
                    <a
                        href={isBuilder ? undefined : ctaUrl}
                        target={isBuilder ? undefined : "_blank"}
                        rel={isBuilder ? undefined : "noopener noreferrer"}
                        onMouseEnter={() => setCtaHov(true)}
                        onMouseLeave={() => setCtaHov(false)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 8,
                            padding: '14px 32px',
                            background: buttonStyle === 'filled' 
                                ? (ctaHov ? buttonColor : `linear-gradient(135deg, ${buttonColor}, ${adjustBrightness(buttonColor, 30)})`)
                                : 'transparent',
                            border: buttonStyle === 'outline' ? `2px solid ${buttonColor}` : 'none',
                            borderRadius: 12,
                            color: buttonStyle === 'filled' ? '#ffffff' : buttonColor,
                            fontSize: 15,
                            fontWeight: 700,
                            textDecoration: 'none',
                            letterSpacing: '0.02em',
                            cursor: isBuilder ? 'default' : 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                            transform: ctaHov ? 'translateY(-2px)' : 'translateY(0)',
                            opacity: buttonStyle === 'ghost' ? (ctaHov ? 1 : 0.8) : 1,
                            boxShadow: buttonStyle === 'filled' ? (ctaHov ? `0 8px 30px ${buttonColor}60` : `0 4px 20px ${buttonColor}30`) : 'none'
                        }}
                    >
                        {ctaLabel}
                        <span style={{ fontSize: 16, transition: 'transform 0.2s', transform: ctaHov ? 'translateX(3px)' : 'none' }}>→</span>
                    </a>
                )}
            </div>
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

HeroBanner.displayName = 'HeroBanner';

export default HeroBanner;
