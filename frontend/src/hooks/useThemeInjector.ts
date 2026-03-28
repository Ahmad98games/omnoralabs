import { useEffect, useRef } from 'react';
import { useBuilderStore } from '../stores/useBuilderStore';

/**
 * 🎨 THEME SETTINGS INTERFACE (Task 3.3)
 */
export interface ThemeSettings {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        border: string;
        success: string;
        warning: string;
        danger: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        monoFont: string;
        baseSize: number;
        headingWeight: number;
        lineHeight: number;
    };
    layout: {
        maxWidth: number;
        contentPadding: number;
        borderRadius: number;
        buttonRadius: number;
    };
}

export const DEFAULT_THEME: ThemeSettings = {
    colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        background: '#000000',
        surface: '#111111',
        text: '#FFFFFF',
        textMuted: '#A1A1AA',
        border: '#27272A',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444'
    },
    typography: {
        headingFont: 'Outfit',
        bodyFont: 'Inter',
        monoFont: 'JetBrains Mono',
        baseSize: 16,
        headingWeight: 700,
        lineHeight: 1.5
    },
    layout: {
        maxWidth: 1280,
        contentPadding: 24,
        borderRadius: 12,
        buttonRadius: 8
    }
};

/**
 * ⚡ USE THEME INJECTOR (Task 3.3)
 * High-performance CSS Variable injection with 50ms batching.
 */
export const useThemeInjector = () => {
    const theme = useBuilderStore(s => s.themeSettings);
    const rafId = useRef<number | null>(null);
    const lastUpdate = useRef<number>(0);

    useEffect(() => {
        const inject = () => {
            const root = document.documentElement;
            
            // 🛡️ BATCHED INJECTION (Industrial Rule)
            // Colors
            Object.entries(theme.colors).forEach(([key, val]) => {
                root.style.setProperty(`--om-color-${key}`, val);
            });

            // Typography
            root.style.setProperty('--om-font-heading', `"${theme.typography.headingFont}", sans-serif`);
            root.style.setProperty('--om-font-body', `"${theme.typography.bodyFont}", sans-serif`);
            root.style.setProperty('--om-base-size', `${theme.typography.baseSize}px`);
            root.style.setProperty('--om-line-height', `${theme.typography.lineHeight}`);

            // Layout
            root.style.setProperty('--om-max-width', `${theme.layout.maxWidth}px`);
            root.style.setProperty('--om-border-radius', `${theme.layout.borderRadius}px`);
            root.style.setProperty('--om-button-radius', `${theme.layout.buttonRadius}px`);

            lastUpdate.current = Date.now();
        };

        // 🛡️ requestAnimationFrame Batching (Zero Wasted Layout)
        const now = Date.now();
        if (now - lastUpdate.current > 50) {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(inject);
        }

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [theme]);
};
