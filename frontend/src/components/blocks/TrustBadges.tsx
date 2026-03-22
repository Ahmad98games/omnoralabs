/**
 * TrustBadges: Authority & Trust Signal Block
 *
 * Displays configurable trust badges (Shipping, Secure Checkout, Returns, etc.).
 * Supports 3 visual styles (minimal, filled, outline), 2 layouts, custom colors.
 * Registered in BuilderRegistry as 'trust_badges'.
 */
import React, { useState } from 'react';

// ─── Default Badge Data ───────────────────────────────────────────────────────

interface TrustBadge {
    icon: string;
    label: string;
    sublabel?: string;
}

const DEFAULT_BADGES: TrustBadge[] = [
    { icon: '🚚', label: 'Free Shipping', sublabel: 'On orders over $50' },
    { icon: '🔒', label: 'Secure Checkout', sublabel: '256-bit SSL encrypted' },
    { icon: '↩️', label: 'Easy Returns', sublabel: '30-day return policy' },
    { icon: '⭐', label: 'Premium Quality', sublabel: 'Handcrafted materials' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TrustBadgesProps {
    nodeId: string;
    isBuilder?: boolean;
    badgeStyle?: 'minimal' | 'filled' | 'outline' | 'icon-text' | 'icon-only' | 'text-only';
    iconColor?: string;
    textColor?: string;
    bgColor?: string;
    layout?: 'horizontal' | 'grid' | 'row';
    columns?: number;
    iconSize?: number;
    gap?: number;
    badges?: TrustBadge[];
    children?: React.ReactNode;
}

// ─── SVG Icons Map ──────────────────────────────────────────────────────────

const SVG_ICONS: Record<string, React.ReactNode> = {
    'shield-check': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"/></svg>,
    'truck': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l4 4v4h-4zm-8 11a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/></svg>,
    'return-arrow': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5M4 9h12a5 5 0 015 5v3"/></svg>,
    'lock': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    'star': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>,
    'clock': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    'phone': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.06 12.06 0 01.88 2.53 2 2 0 01-.44 1.94L7.8 9.9a16 16 0 006.3 6.3l1.73-1.73 a2 2 0 011.94-.44 12.06 12.06 0 012.53.88 2 2 0 011.72 2z"/></svg>
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TrustBadges: React.FC<TrustBadgesProps> = ({
    nodeId,
    isBuilder = false,
    badgeStyle = 'icon-text',
    iconColor = '#7c6dfa',
    textColor = '#f0f0f5',
    bgColor = '#13131a',
    layout = 'row',
    columns = 3,
    iconSize = 32,
    gap = 14,
    badges = DEFAULT_BADGES,
}) => {

    const isGrid = layout === 'grid';

    return (
        <div
            data-node-id={nodeId}
            style={{
                display: 'grid',
                gridTemplateColumns: isGrid ? `repeat(${columns}, 1fr)` : `repeat(${badges.length}, 1fr)`,
                gap,
                padding: '20px 24px',
                fontFamily: "'Inter', -apple-system, sans-serif",
                background: bgColor,
                borderRadius: 14,
            }}
        >
            {badges.map((badge, i) => (
                <BadgeItem
                    key={i}
                    badge={badge}
                    style={badgeStyle === 'minimal' ? 'minimal' : badgeStyle === 'outline' ? 'outline' : 'filled'}
                    iconColor={iconColor}
                    textColor={textColor}
                    bgColor={bgColor}
                    isVertical={isGrid}
                    showSublabel={badgeStyle !== 'icon-only'}
                    iconSize={iconSize}
                />
            ))}
        </div>
    );
};

// ─── Badge Item ───────────────────────────────────────────────────────────────

const BadgeItem: React.FC<{
    badge: TrustBadge;
    style: 'minimal' | 'filled' | 'outline';
    iconColor: string;
    textColor: string;
    bgColor: string;
    isVertical: boolean;
    showSublabel: boolean;
    iconSize: number;
}> = ({ badge, style: badgeStyle, iconColor, textColor, bgColor, isVertical, showSublabel, iconSize }) => {
    const [hov, setHov] = useState(false);

    const baseStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        alignItems: 'center',
        gap: isVertical ? 14 : 10,
        padding: badgeStyle === 'minimal' ? '12px 8px' : '18px 16px',
        borderRadius: 12,
        textAlign: isVertical ? 'left' : 'center',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        cursor: 'default',
        transform: hov ? 'translateY(-2px)' : 'none',
    };

    // Style variants
    switch (badgeStyle) {
        case 'filled':
            Object.assign(baseStyle, {
                background: bgColor,
                border: `1px solid ${hov ? iconColor + '40' : '#2a2a3a'}`,
                boxShadow: hov ? `0 8px 24px ${iconColor}15` : 'none',
            });
            break;
        case 'outline':
            Object.assign(baseStyle, {
                background: 'transparent',
                border: `1.5px solid ${hov ? iconColor : '#2a2a3a'}`,
            });
            break;
        case 'minimal':
            Object.assign(baseStyle, {
                background: 'transparent',
                border: 'none',
            });
            break;
    }

    return (
        <div
            style={baseStyle}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            {/* Icon */}
            {badgeStyle !== 'text-only' && (
                <div style={{
                    width: iconSize + 12,
                    height: iconSize + 12,
                    borderRadius: 10,
                    background: `${iconColor}12`,
                    border: `1px solid ${iconColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: iconColor,
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: hov ? 'scale(1.08)' : 'scale(1)',
                }}>
                    {React.isValidElement(SVG_ICONS[badge.icon]) ? 
                        React.cloneElement(SVG_ICONS[badge.icon] as React.ReactElement, { width: iconSize, height: iconSize }) 
                        : badge.icon}
                </div>
            )}

            {/* Text */}
            {badgeStyle !== 'icon-only' && (
                <div style={isVertical ? { flex: 1 } : undefined}>
                    <p style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: textColor,
                        margin: 0,
                        lineHeight: 1.3,
                        letterSpacing: '-0.01em',
                    }}>
                        {badge.text}
                    </p>
                    {showSublabel && badge.subtext && (
                        <p style={{
                            fontSize: 11,
                            color: '#8b8ba0',
                            margin: '3px 0 0',
                            lineHeight: 1.3,
                            fontWeight: 500,
                        }}>
                            {badge.subtext}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default TrustBadges;
