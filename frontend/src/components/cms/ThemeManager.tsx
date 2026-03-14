/**
 * ThemeManager: Global CSS Tokens
 *
 * Injects CSS variables into the root to provide global cinematic/dark aesthetics.
 * Inherited implicitly by all Omnora blocks.
 */
import React, { useEffect } from 'react';

export interface ThemeConfig {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    fontHeading: string;
    fontBody: string;
}

export const defaultTheme: ThemeConfig = {
    primaryColor: '#7c6dfa',
    accentColor: '#34d399',      // success/accent
    backgroundColor: '#050508',  // deep cinematic black
    surfaceColor: '#13131a',     // slightly lighter for cards/blocks
    borderColor: '#2a2a3a',      // subtle borders
    textPrimary: '#f0f0f5',
    textSecondary: '#8b8ba0',
    fontHeading: "'Inter', -apple-system, sans-serif",
    fontBody: "'Inter', -apple-system, sans-serif",
};

export const ThemeManager: React.FC<{ theme?: Partial<ThemeConfig> }> = ({ theme }) => {
    useEffect(() => {
        const root = document.documentElement;
        const config = { ...defaultTheme, ...theme };

        root.style.setProperty('--theme-primary', config.primaryColor);
        root.style.setProperty('--theme-accent', config.accentColor);
        root.style.setProperty('--theme-bg', config.backgroundColor);
        root.style.setProperty('--theme-surface', config.surfaceColor);
        root.style.setProperty('--theme-border', config.borderColor);
        root.style.setProperty('--theme-text-primary', config.textPrimary);
        root.style.setProperty('--theme-text-secondary', config.textSecondary);
        root.style.setProperty('--theme-font-heading', config.fontHeading);
        root.style.setProperty('--theme-font-body', config.fontBody);

        // Global resets for the builder canvas specifically
        root.style.setProperty('background-color', 'var(--theme-bg)');
        root.style.setProperty('color', 'var(--theme-text-primary)');
        if (!document.body.style.fontFamily) {
            document.body.style.fontFamily = config.fontBody;
        }

    }, [theme]);

    return null; // Purely logical component
};

export default ThemeManager;
