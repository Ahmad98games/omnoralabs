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
    icon: string;
    title: string;
    description: string;
}

export interface FeaturesGridProps {
    nodeId: string;
    headline?: string;
    columns?: number;
    gap?: number;
    iconSize?: number;
    iconColor?: string;
    iconBackground?: string;
    cardStyle?: 'flat' | 'bordered' | 'elevated';
    features?: Feature[];
    children?: React.ReactNode;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_FEATURES: Feature[] = [
    { icon: '🚀', title: 'Lightning Delivery', description: 'Free express shipping on orders over $50. Get your items in 2-3 business days.' },
    { icon: '🛡️', title: 'Secure Payments', description: '256-bit SSL encryption protects every transaction. Your data is always safe with us.' },
    { icon: '⭐', title: 'Premium Quality', description: 'Handcrafted from the finest materials by skilled artisans. Built to last a lifetime.' },
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
    columns = 3,
    iconSize = 32,
    iconColor = '#7c6dfa',
    iconBackground,
    cardStyle = 'bordered',
    gap = 24,
    features = DEFAULT_FEATURES,
}) => {
    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '32px 0',
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
                        iconSize={iconSize}
                        iconColor={iconColor}
                        iconBackground={iconBackground}
                        cardStyle={cardStyle}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────

const FeatureCard: React.FC<{
    feature: Feature; 
    iconSize: number; 
    iconColor: string; 
    iconBackground?: string;
    cardStyle?: 'flat' | 'bordered' | 'elevated';
}> = ({ feature, iconSize, iconColor, iconBackground, cardStyle = 'bordered' }) => {
    const [hov, setHov] = useState(false);

    const isElevated = cardStyle === 'elevated';
    const isBordered = cardStyle === 'bordered';

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: T.surface,
                border: isBordered ? `1px solid ${T.border}` : `1px solid ${hov ? iconColor + '40' : 'transparent'}`,
                borderRadius: 14,
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                transform: hov ? 'translateY(-4px)' : 'none',
                boxShadow: isElevated ? '0 12px 30px rgba(0,0,0,0.25)' : hov ? `0 12px 32px ${iconColor}12` : 'none',
            }}
        >
            <div style={{
                width: iconSize + 24, height: iconSize + 24, borderRadius: '50%',
                background: iconBackground || `${iconColor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: iconSize,
                transition: 'transform 0.2s',
                transform: hov ? 'scale(1.08)' : 'scale(1)',
            }}>
                {feature.icon}
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
