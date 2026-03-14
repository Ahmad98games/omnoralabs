/**
 * AnnouncementBar: Top-of-Page Promo Bar
 *
 * Thin sticky bar with rotating messages via fade interval.
 * Registered in BuilderRegistry as 'announcement_bar'.
 */
import React, { useState, useEffect, useCallback } from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AnnouncementBarProps {
    nodeId: string;
    messages?: string[];
    bgColor?: string;
    textColor?: string;
    isSticky?: boolean;
    enableSlider?: boolean;
    interval?: number;      // ms between slides
    fontSize?: number;
    showClose?: boolean;
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
    nodeId,
    messages = ['🚚 Free shipping on orders over $50', '🔥 Flash Sale — 20% off everything!', '⭐ New collection just dropped'],
    bgColor = '#7c6dfa',
    textColor = '#ffffff',
    isSticky = true,
    enableSlider = true,
    interval = 3500,
    fontSize = 12,
    showClose = false,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    const safeMessages = messages.length > 0 ? messages : ['Welcome to our store!'];

    // Auto-rotate messages
    useEffect(() => {
        if (!enableSlider || safeMessages.length <= 1) return;

        const timer = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % safeMessages.length);
                setFade(true);
            }, 250);
        }, interval);

        return () => clearInterval(timer);
    }, [enableSlider, safeMessages.length, interval]);

    const handleClose = useCallback(() => setDismissed(true), []);

    if (dismissed) return null;

    return (
        <div
            data-node-id={nodeId}
            style={{
                background: bgColor,
                padding: '10px 24px',
                textAlign: 'center',
                fontFamily: "'Inter', -apple-system, sans-serif",
                position: isSticky ? 'sticky' : 'relative',
                top: isSticky ? 0 : undefined,
                zIndex: isSticky ? 900 : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
            }}
        >
            <span style={{
                fontSize,
                fontWeight: 600,
                color: textColor,
                letterSpacing: '0.02em',
                transition: 'opacity 0.25s ease',
                opacity: fade ? 1 : 0,
            }}>
                {safeMessages[currentIndex % safeMessages.length]}
            </span>

            {showClose && (
                <button
                    onClick={handleClose}
                    aria-label="Close announcement"
                    style={{
                        position: 'absolute', right: 16, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent', border: 'none',
                        color: textColor, fontSize: 16,
                        cursor: 'pointer', opacity: 0.6,
                        padding: 4, lineHeight: 1,
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default AnnouncementBar;
