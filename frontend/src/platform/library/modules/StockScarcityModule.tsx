import React from 'react';

export interface StockScarcityProps {
    stock: number;
    threshold?: number;           // show warning below this number (default: 5)
    hideIfAboveThreshold?: boolean;
    intensity?: 'subtle' | 'normal' | 'aggressive';
}

const StockScarcityModule: React.FC<StockScarcityProps> = ({
    stock,
    threshold = 5,
    hideIfAboveThreshold = true,
    intensity = 'normal',
}) => {
    if (hideIfAboveThreshold && stock > threshold) return null;
    if (stock <= 0) {
        return (
            <div style={{ background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', borderRadius: 8, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span>❌</span>
                <span style={{ color: '#9AA4B2', fontWeight: 600 }}>Out of stock</span>
            </div>
        );
    }

    const COLOR = intensity === 'aggressive' ? '#dc2626' : intensity === 'normal' ? '#f87171' : '#fbbf24';
    const BG = intensity === 'aggressive' ? 'rgba(220,38,38,0.12)' : intensity === 'normal' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.08)';
    const BORDER = intensity === 'aggressive' ? 'rgba(220,38,38,0.35)' : intensity === 'normal' ? 'rgba(248,113,113,0.22)' : 'rgba(251,191,36,0.2)';
    const EMOJI = intensity === 'aggressive' ? '🔥' : '⚠️';

    return (
        <div style={{
            background: BG, border: `1px solid ${BORDER}`, borderRadius: 8,
            padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: COLOR, fontWeight: 700,
        }}>
            <span>{EMOJI}</span>
            <span>Only <strong>{stock}</strong> left in stock — order soon!</span>
            {intensity === 'aggressive' && (
                <span style={{ background: COLOR, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>LIMITED</span>
            )}
        </div>
    );
};

export default StockScarcityModule;
