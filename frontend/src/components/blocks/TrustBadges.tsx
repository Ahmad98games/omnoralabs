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
    badgeStyle?: 'minimal' | 'filled' | 'outline';
    iconColor?: string;
    textColor?: string;
    bgColor?: string;
    layout?: 'horizontal' | 'vertical';
    columns?: number;
    gap?: number;
    showSublabels?: boolean;
    badge1Label?: string;
    badge1Icon?: string;
    badge2Label?: string;
    badge2Icon?: string;
    badge3Label?: string;
    badge3Icon?: string;
    badge4Label?: string;
    badge4Icon?: string;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TrustBadges: React.FC<TrustBadgesProps> = ({
    nodeId,
    badgeStyle = 'filled',
    iconColor = '#7c6dfa',
    textColor = '#f0f0f5',
    bgColor = '#13131a',
    layout = 'horizontal',
    columns = 4,
    gap = 14,
    showSublabels = true,
    badge1Label,
    badge1Icon,
    badge2Label,
    badge2Icon,
    badge3Label,
    badge3Icon,
    badge4Label,
    badge4Icon,
}) => {
    // Build badge list from props or defaults
    const badges: TrustBadge[] = [
        { icon: badge1Icon || DEFAULT_BADGES[0].icon, label: badge1Label || DEFAULT_BADGES[0].label, sublabel: DEFAULT_BADGES[0].sublabel },
        { icon: badge2Icon || DEFAULT_BADGES[1].icon, label: badge2Label || DEFAULT_BADGES[1].label, sublabel: DEFAULT_BADGES[1].sublabel },
        { icon: badge3Icon || DEFAULT_BADGES[2].icon, label: badge3Label || DEFAULT_BADGES[2].label, sublabel: DEFAULT_BADGES[2].sublabel },
        { icon: badge4Icon || DEFAULT_BADGES[3].icon, label: badge4Label || DEFAULT_BADGES[3].label, sublabel: DEFAULT_BADGES[3].sublabel },
    ];

    const isVertical = layout === 'vertical';

    return (
        <div
            data-node-id={nodeId}
            style={{
                display: 'grid',
                gridTemplateColumns: isVertical ? '1fr' : `repeat(${columns}, 1fr)`,
                gap,
                padding: '20px 24px',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {badges.map((badge, i) => (
                <BadgeItem
                    key={i}
                    badge={badge}
                    style={badgeStyle}
                    iconColor={iconColor}
                    textColor={textColor}
                    bgColor={bgColor}
                    isVertical={isVertical}
                    showSublabel={showSublabels}
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
}> = ({ badge, style: badgeStyle, iconColor, textColor, bgColor, isVertical, showSublabel }) => {
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
            <div style={{
                width: badgeStyle === 'minimal' ? 36 : 44,
                height: badgeStyle === 'minimal' ? 36 : 44,
                borderRadius: 10,
                background: `${iconColor}12`,
                border: `1px solid ${iconColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: badgeStyle === 'minimal' ? 18 : 20,
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: hov ? 'scale(1.08)' : 'scale(1)',
            }}>
                {badge.icon}
            </div>

            {/* Text */}
            <div style={isVertical ? { flex: 1 } : undefined}>
                <p style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: textColor,
                    margin: 0,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                }}>
                    {badge.label}
                </p>
                {showSublabel && badge.sublabel && (
                    <p style={{
                        fontSize: 11,
                        color: '#8b8ba0',
                        margin: '3px 0 0',
                        lineHeight: 1.3,
                        fontWeight: 500,
                    }}>
                        {badge.sublabel}
                    </p>
                )}
            </div>
        </div>
    );
};

export default TrustBadges;
