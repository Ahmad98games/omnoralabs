/**
 * FeaturesGrid: Value Proposition Block
 *
 * Highlights store features (Support, Quality, Shipping, etc.)
 * with configurable icon styles and responsive columns.
 * Registered in BuilderRegistry as 'features_grid'.
 */
import React, { useState } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Feature {
    iconName: string;
    title: string;
    description: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FeaturesGridProps {
    nodeId: string;
    headline?: string;
    columns?: number;
    iconStyle?: 'outline' | 'solid';
    iconColor?: string;
    bgColor?: string;
    gap?: number;
    features?: Feature[];
    children?: React.ReactNode;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_FEATURES: Feature[] = [
    { iconName: '🚀', title: 'Lightning Fast Delivery', description: 'Free express shipping on orders over $50. Get your items in 2-3 business days.' },
    { iconName: '🛡️', title: 'Secure Payments', description: '256-bit SSL encryption protects every transaction. Your data is always safe with us.' },
    { iconName: '⭐', title: 'Premium Quality', description: 'Handcrafted from the finest materials by skilled artisans. Built to last a lifetime.' },
    { iconName: '💬', title: '24/7 Support', description: 'Our dedicated team is always here to help. Reach us via chat, email, or phone anytime.' },
];

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    surface: '#13131a',
    border: '#2a2a3a',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({
    nodeId,
    headline = 'Why Choose Us',
    columns = 4,
    iconStyle = 'solid',
    iconColor = '#7c6dfa',
    bgColor = 'transparent',
    gap = 16,
    features = DEFAULT_FEATURES,
}) => {
    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '32px 0', background: bgColor,
            }}
        >
            {headline && (
                <h2 style={{
                    fontSize: 22, fontWeight: 800, color: T.text,
                    margin: '0 0 28px', letterSpacing: '-0.03em',
                    textAlign: 'center',
                }}>
                    {headline}
                </h2>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)`,
                gap,
            }}>
                {features.map((feature, i) => (
                    <FeatureCard
                        key={i}
                        feature={feature}
                        iconStyle={iconStyle}
                        iconColor={iconColor}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────

const FeatureCard: React.FC<{
    feature: Feature; iconStyle: 'outline' | 'solid'; iconColor: string;
}> = ({ feature, iconStyle, iconColor }) => {
    const [hov, setHov] = useState(false);

    const isSolid = iconStyle === 'solid';

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: T.surface,
                border: `1px solid ${hov ? iconColor + '40' : T.border}`,
                borderRadius: 14,
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                transform: hov ? 'translateY(-4px)' : 'none',
                boxShadow: hov ? `0 12px 32px ${iconColor}12` : 'none',
            }}
        >
            <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: isSolid ? `${iconColor}18` : 'transparent',
                border: isSolid ? `1px solid ${iconColor}25` : `2px solid ${iconColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                transition: 'transform 0.2s',
                transform: hov ? 'scale(1.1)' : 'scale(1)',
            }}>
                {feature.iconName}
            </div>
            <h3 style={{
                fontSize: 14, fontWeight: 700, color: T.text,
                margin: 0, letterSpacing: '-0.01em',
            }}>
                {feature.title}
            </h3>
            <p style={{
                fontSize: 12, color: T.textDim, lineHeight: 1.6,
                margin: 0, fontWeight: 400,
            }}>
                {feature.description}
            </p>
        </div>
    );
};

export default FeaturesGrid;
