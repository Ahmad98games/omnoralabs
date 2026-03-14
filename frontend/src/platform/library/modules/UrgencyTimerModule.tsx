import React, { useState, useEffect } from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UrgencyTimerProps {
    endTime: string;       // ISO date string — when the timer expires
    message?: string;      // e.g. "Offer ends in:"
    intensity?: 'subtle' | 'normal' | 'aggressive';
    style?: 'inline' | 'banner' | 'floating';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRemainingMs(endTime: string): number {
    return Math.max(0, new Date(endTime).getTime() - Date.now());
}

function formatTime(ms: number) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return { h, m, s, expired: ms === 0 };
}

// ─── Styles by intensity ──────────────────────────────────────────────────────

const INTENSITY_STYLES = {
    subtle: {
        bg: 'rgba(124,109,250,0.08)',
        border: '1px solid rgba(124,109,250,0.15)',
        digitBg: '#1a1a2e',
        digitColor: '#a78bfa',
        msgColor: '#9AA4B2',
        glow: 'none',
    },
    normal: {
        bg: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        digitBg: '#1f1212',
        digitColor: '#f87171',
        msgColor: '#E8ECF1',
        glow: 'none',
    },
    aggressive: {
        bg: 'rgba(239,68,68,0.14)',
        border: '1px solid rgba(239,68,68,0.4)',
        digitBg: '#7f1d1d',
        digitColor: '#ffffff',
        msgColor: '#ffffff',
        glow: '0 0 20px rgba(239,68,68,0.35)',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

const UrgencyTimerModule: React.FC<UrgencyTimerProps> = ({
    endTime,
    message = 'Offer ends in:',
    intensity = 'normal',
    style: displayStyle = 'inline',
}) => {
    const [remaining, setRemaining] = useState(() => getRemainingMs(endTime));

    useEffect(() => {
        if (remaining === 0) return;
        const interval = setInterval(() => {
            const next = getRemainingMs(endTime);
            setRemaining(next);
            if (next === 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    const { h, m, s, expired } = formatTime(remaining);
    const theme = INTENSITY_STYLES[intensity];

    const Digit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
                background: theme.digitBg, color: theme.digitColor,
                borderRadius: 8, padding: '10px 14px', minWidth: 48,
                fontSize: 26, fontWeight: 800, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                {String(value).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 9, color: theme.msgColor, fontWeight: 700, letterSpacing: '0.08em' }}>{label}</div>
        </div>
    );

    const Sep: React.FC = () => (
        <div style={{ color: theme.digitColor, fontSize: 22, fontWeight: 800, marginBottom: 16, opacity: 0.6 }}>:</div>
    );

    if (expired) return (
        <div style={{ background: theme.bg, border: theme.border, borderRadius: 12, padding: '14px 20px', textAlign: 'center', boxShadow: theme.glow }}>
            <span style={{ color: theme.digitColor, fontWeight: 700, fontSize: 14 }}>⏱️ This offer has ended</span>
        </div>
    );

    const inner = (
        <div style={{ background: theme.bg, border: theme.border, borderRadius: displayStyle === 'floating' ? 16 : 12, padding: displayStyle === 'banner' ? '12px 24px' : '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 16, boxShadow: theme.glow }}>
            <span style={{ color: theme.msgColor, fontSize: 13, fontWeight: 600 }}>⏰ {message}</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <Digit value={h} label="HRS" />
                <Sep />
                <Digit value={m} label="MIN" />
                <Sep />
                <Digit value={s} label="SEC" />
            </div>
        </div>
    );

    if (displayStyle === 'floating') {
        return (
            <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, maxWidth: 360 }}>
                {inner}
            </div>
        );
    }

    return inner;
};

export default UrgencyTimerModule;
