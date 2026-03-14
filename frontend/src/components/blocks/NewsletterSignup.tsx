/**
 * NewsletterSignup: Lead Generation Block
 *
 * Email capture form with stacked/inline layouts, success state animation,
 * and configurable copy. Mock onSubmit with visual feedback.
 * Registered in BuilderRegistry as 'newsletter_signup'.
 */
import React, { useState, useCallback } from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewsletterSignupProps {
    nodeId: string;
    headline?: string;
    subheadline?: string;
    buttonText?: string;
    buttonColor?: string;
    bgColor?: string;
    layout?: 'stacked' | 'inline';
    showNameField?: boolean;
    successMessage?: string;
    children?: React.ReactNode;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    success: '#34d399',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
    nodeId,
    headline = 'Stay in the Loop',
    subheadline = 'Subscribe to our newsletter for exclusive deals, new arrivals, and insider access.',
    buttonText = 'Subscribe',
    buttonColor = '#7c6dfa',
    bgColor = '#13131a',
    layout = 'stacked',
    showNameField = false,
    successMessage = '✅ You\'re in! Check your inbox for a welcome gift.',
}) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setStatus('submitting');
        // Simulate API call
        await new Promise(res => setTimeout(res, 1000));
        setStatus('success');
        setEmail('');
        setName('');
    }, [email]);

    const isInline = layout === 'inline';

    if (status === 'success') {
        return (
            <div data-node-id={nodeId} style={{
                padding: '40px 32px', textAlign: 'center',
                background: bgColor, borderRadius: 16,
                border: `1px solid rgba(52,211,153,0.2)`,
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 28,
                    background: 'rgba(52,211,153,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 24,
                    animation: 'omnoraNewsletterPop 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}>
                    ✓
                </div>
                <p style={{
                    fontSize: 15, fontWeight: 600, color: T.success, margin: '0 0 8px',
                }}>
                    {successMessage}
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    style={{
                        marginTop: 12, padding: '8px 20px',
                        background: 'transparent', border: `1px solid ${T.border}`,
                        borderRadius: 8, color: T.textDim, fontSize: 12,
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Subscribe another email
                </button>
                <style>{`@keyframes omnoraNewsletterPop { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }`}</style>
            </div>
        );
    }

    return (
        <div
            data-node-id={nodeId}
            style={{
                padding: '36px 32px',
                background: bgColor,
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                fontFamily: "'Inter', -apple-system, sans-serif",
                textAlign: isInline ? 'left' : 'center',
            }}
        >
            {headline && (
                <h3 style={{
                    fontSize: 20, fontWeight: 800, color: T.text,
                    margin: '0 0 8px', letterSpacing: '-0.02em',
                }}>
                    {headline}
                </h3>
            )}
            {subheadline && (
                <p style={{
                    fontSize: 13, color: T.textDim, margin: '0 0 24px',
                    lineHeight: 1.6, maxWidth: 480,
                    marginLeft: isInline ? 0 : 'auto',
                    marginRight: isInline ? 0 : 'auto',
                }}>
                    {subheadline}
                </p>
            )}

            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: isInline ? 'row' : 'column',
                    gap: 10,
                    maxWidth: isInline ? 520 : 400,
                    margin: isInline ? 0 : '0 auto',
                    alignItems: isInline ? 'flex-start' : 'stretch',
                }}
            >
                {showNameField && (
                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={inputStyle(T)}
                    />
                )}
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    style={{
                        ...inputStyle(T),
                        flex: isInline ? 1 : undefined,
                        borderColor: error ? '#ff4d6a' : T.border,
                    }}
                />
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    style={{
                        padding: '12px 28px',
                        background: status === 'submitting' ? T.surface2 : `linear-gradient(135deg, ${buttonColor}, ${adjustBrightness(buttonColor, 25)})`,
                        border: 'none', borderRadius: 10,
                        color: '#fff', fontSize: 14, fontWeight: 700,
                        cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.02em', fontFamily: 'inherit',
                        transition: 'all 0.2s',
                        boxShadow: `0 4px 16px ${buttonColor}30`,
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                >
                    {status === 'submitting' && (
                        <span style={{
                            width: 14, height: 14,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff', borderRadius: '50%',
                            animation: 'omnoraNewsletterSpin 0.5s linear infinite',
                            display: 'inline-block',
                        }} />
                    )}
                    {status === 'submitting' ? 'Subscribing...' : buttonText}
                </button>
            </form>

            {error && (
                <p style={{ fontSize: 11, color: '#ff4d6a', marginTop: 8, textAlign: isInline ? 'left' : 'center' }}>
                    {error}
                </p>
            )}

            <p style={{
                fontSize: 10, color: T.textMuted, marginTop: 14,
                textAlign: isInline ? 'left' : 'center',
            }}>
                🔒 No spam, ever. Unsubscribe anytime.
            </p>

            <style>{`@keyframes omnoraNewsletterSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputStyle(t: typeof T): React.CSSProperties {
    return {
        padding: '12px 16px',
        background: t.surface2,
        border: `1.5px solid ${t.border}`,
        borderRadius: 10, color: t.text,
        fontSize: 14, fontWeight: 500,
        outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
        boxSizing: 'border-box' as const,
        width: '100%',
    };
}

function adjustBrightness(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default NewsletterSignup;
