import React, { useState, useEffect } from 'react';

// ─── Countdown Types ─────────────────────────────────────────────────────────

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

export interface CountdownTimerProps {
    nodeId: string;
    isBuilder?: boolean;
    targetDate?: string;
    expiredMessage?: string;
    expiredAction?: 'hide' | 'show-text' | 'redirect';
    redirectUrl?: string;
    style?: 'minimal' | 'boxed' | 'inline';
    digitColor?: string;
    labelColor?: string;
    digitBackground?: string;
    backgroundColor?: string;
    labelDays?: string;
    labelHours?: string;
    labelMinutes?: string;
    labelSeconds?: string;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    nodeId,
    isBuilder = false,
    targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiredMessage = 'This offer has ended',
    expiredAction = 'show-text',
    redirectUrl = '#',
    style = 'boxed',
    digitColor = '#7c6dfa',
    labelColor = '#5a5a70',
    digitBackground = 'rgba(124, 109, 250, 0.1)',
    backgroundColor = '#13131a',
    labelDays = 'Days',
    labelHours = 'Hours',
    labelMinutes = 'Min',
    labelSeconds = 'Sec',
}) => {
    const calcTimeLeft = React.useCallback((): TimeLeft => {
        const target = new Date(targetDate).getTime();
        const diff = target - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            expired: false,
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft());

    useEffect(() => {
        if (isBuilder) return; // Disable ticking in builder context to prevent canvas re-render lag

        const timer = setInterval(() => {
            const current = calcTimeLeft();
            setTimeLeft(current);
            if (current.expired && expiredAction === 'redirect' && redirectUrl && redirectUrl !== '#') {
                window.location.replace(redirectUrl);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isBuilder, expiredAction, redirectUrl, calcTimeLeft]);

    const segments = [
        { value: timeLeft.days, label: labelDays },
        { value: timeLeft.hours, label: labelHours },
        { value: timeLeft.minutes, label: labelMinutes },
        { value: timeLeft.seconds, label: labelSeconds },
    ];

    if (timeLeft.expired) {
        if (expiredAction === 'hide') return null;
        if (expiredAction === 'show-text' || expiredAction === 'redirect') {
            return (
                <div data-node-id={nodeId} style={{
                    padding: 24, textAlign: 'center',
                    background: backgroundColor, borderRadius: 14,
                    border: `1px solid rgba(255,255,255,0.08)`,
                    fontFamily: "'Inter', sans-serif",
                }}>
                    <span style={{ fontSize: 16, color: '#8b8ba0', fontWeight: 600 }}>{expiredMessage}</span>
                </div>
            );
        }
    }

    const isBoxed = style === 'boxed';
    const isInline = style === 'inline';

    return (
        <div
            data-node-id={nodeId}
            style={{
                display: 'flex',
                flexDirection: isBoxed ? 'column' : 'row',
                alignItems: 'center',
                gap: isBoxed ? 18 : 12,
                padding: isBoxed ? '24px 32px' : '12px 20px',
                background: backgroundColor,
                borderRadius: 12,
                fontFamily: "'Inter', -apple-system, sans-serif",
                justifyContent: 'center',
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isBoxed ? 10 : 6,
            }}>
                {segments.map((seg, i) => (
                    <React.Fragment key={seg.label}>
                        {i > 0 && (
                            <span style={{
                                fontSize: isBoxed ? 24 : 18,
                                fontWeight: 800,
                                color: digitColor,
                                opacity: 0.5,
                                animation: isBuilder ? 'none' : 'omnoraCountdownPulse 1s ease-in-out infinite',
                            }}>
                                :
                            </span>
                        )}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: isBoxed ? 60 : 38,
                        }}>
                            <span style={{
                                fontSize: isBoxed ? 32 : 20,
                                fontWeight: 900,
                                color: digitColor,
                                fontVariantNumeric: 'tabular-nums',
                                background: digitBackground,
                                borderRadius: 8,
                                padding: isBoxed ? '10px 14px' : '6px 10px',
                                border: `1px solid ${digitColor}20`,
                            }}>
                                {String(seg.value).padStart(2, '0')}
                            </span>
                            {!isInline && (
                                <span style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: labelColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginTop: 6,
                                }}>
                                    {seg.label}
                                </span>
                            )}
                        </div>
                    </React.Fragment>
                ))}
            </div>

            <style>{`
                @keyframes omnoraCountdownPulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.15; }
                }
            `}</style>
        </div>
    );
};

export default CountdownTimer;
