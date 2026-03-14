/**
 * CountdownTimer: Conversion-Driving Countdown Block
 *
 * Ticks down to a target date using a pure React hook (no external libs).
 * Supports inline and boxed layouts, custom colors, and title text.
 * Registered in BuilderRegistry as 'countdown_timer'.
 */
import React, { useState, useEffect, useMemo } from 'react';

// ─── Countdown Hook ───────────────────────────────────────────────────────────

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

function useCountdown(targetDate: string): TimeLeft {
    const target = useMemo(() => new Date(targetDate).getTime(), [targetDate]);

    const calcTimeLeft = (): TimeLeft => {
        const diff = target - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            expired: false,
        };
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [target]);

    return timeLeft;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CountdownTimerProps {
    nodeId: string;
    targetDate?: string;
    title?: string;
    expiredMessage?: string;
    themeColor?: string;
    bgColor?: string;
    layout?: 'inline' | 'boxed';
    showLabels?: boolean;
    showDays?: boolean;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    nodeId,
    targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    title = '🔥 Flash Sale Ends In',
    expiredMessage = 'Sale has ended!',
    themeColor = '#7c6dfa',
    bgColor = '#13131a',
    layout = 'boxed',
    showLabels = true,
    showDays = true,
}) => {
    const timeLeft = useCountdown(targetDate);

    const isBoxed = layout === 'boxed';

    const segments: { value: number; label: string }[] = [
        ...(showDays ? [{ value: timeLeft.days, label: 'Days' }] : []),
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
    ];

    if (timeLeft.expired) {
        return (
            <div data-node-id={nodeId} style={{
                padding: 24, textAlign: 'center',
                background: bgColor, borderRadius: 14,
                border: `1px solid #2a2a3a`,
                fontFamily: "'Inter', sans-serif",
            }}>
                <span style={{ fontSize: 16, color: '#8b8ba0', fontWeight: 600 }}>{expiredMessage}</span>
            </div>
        );
    }

    return (
        <div
            data-node-id={nodeId}
            style={{
                display: 'flex',
                flexDirection: isBoxed ? 'column' : 'row',
                alignItems: 'center',
                gap: isBoxed ? 18 : 16,
                padding: isBoxed ? '28px 32px' : '16px 24px',
                background: bgColor,
                border: `1px solid ${themeColor}25`,
                borderRadius: 14,
                fontFamily: "'Inter', -apple-system, sans-serif",
                justifyContent: 'center',
            }}
        >
            {/* Title */}
            {title && (
                <span style={{
                    fontSize: isBoxed ? 15 : 13,
                    fontWeight: 700,
                    color: '#f0f0f5',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                }}>
                    {title}
                </span>
            )}

            {/* Digits */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isBoxed ? 10 : 8,
            }}>
                {segments.map((seg, i) => (
                    <React.Fragment key={seg.label}>
                        {i > 0 && (
                            <span style={{
                                fontSize: isBoxed ? 24 : 18,
                                fontWeight: 800,
                                color: themeColor,
                                opacity: 0.5,
                                animation: 'omnoraCountdownPulse 1s ease-in-out infinite',
                            }}>
                                :
                            </span>
                        )}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: isBoxed ? 68 : 46,
                        }}>
                            <span style={{
                                fontSize: isBoxed ? 32 : 22,
                                fontWeight: 900,
                                color: themeColor,
                                letterSpacing: '-0.03em',
                                lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                                background: `${themeColor}10`,
                                borderRadius: 8,
                                padding: isBoxed ? '10px 14px' : '6px 10px',
                                border: `1px solid ${themeColor}20`,
                            }}>
                                {String(seg.value).padStart(2, '0')}
                            </span>
                            {showLabels && (
                                <span style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: '#5a5a70',
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
