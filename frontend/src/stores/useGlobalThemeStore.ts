/**
 * useGlobalThemeStore.ts — Theme-Agnostic Design Token Engine
 *
 * Zustand atomic store for global design tokens. This is the single source of truth
 * for the entire builder canvas's visual identity.
 *
 * DESIGN PHILOSOPHY:
 *  - Un-opinionated: No default aesthetic bias. Tokens define structure, not opinion.
 *  - Inheritable: Canvas components read from this store by default.
 *  - Overridable: Per-node local props can override any global token.
 *  - Serializable: The entire theme object is saved to the CMS draft alongside the AST.
 *
 * INVARIANTS:
 *  - Colors use 6/8 digit hex (#RRGGBB or #RRGGBBAA)
 *  - Font families are valid Google Font names or system font stacks
 *  - Border radii map to CSS pixel values
 *  - Shadow presets generate CSS-compatible box-shadow strings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Strict Type Definitions ────────────────────────────────────────────────

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
}

export interface ThemeTypography {
    headingFont: string;
    bodyFont: string;
    headingWeight: number;
    bodyWeight: number;
    baseSize: number;       // px
    lineHeight: number;     // unitless multiplier e.g. 1.6
    letterSpacing: number;  // em
}

export type RadiusPreset = 'none' | 'sharp' | 'rounded' | 'pill';

export interface ThemeRadii {
    preset: RadiusPreset;
    button: string;     // CSS value e.g. '8px', '9999px'
    card: string;
    input: string;
    image: string;
}

export type ShadowPreset = 'none' | 'soft' | 'elevated' | 'neon-glow' | 'hard-drop';

export interface ThemeShadows {
    preset: ShadowPreset;
    cardShadow: string;     // raw CSS box-shadow value
    buttonShadow: string;
    custom: string;          // power-user raw override
}

export interface GlobalTheme {
    colors: ThemeColors;
    typography: ThemeTypography;
    radii: ThemeRadii;
    shadows: ThemeShadows;
    customCSS: string;       // Global raw CSS injection for power users
}

export interface GlobalThemeActions {
    setColors: (patch: Partial<ThemeColors>) => void;
    setTypography: (patch: Partial<ThemeTypography>) => void;
    setRadii: (preset: RadiusPreset) => void;
    setRadiiField: <K extends keyof ThemeRadii>(key: K, value: ThemeRadii[K]) => void;
    setShadows: (preset: ShadowPreset) => void;
    setShadowField: <K extends keyof ThemeShadows>(key: K, value: ThemeShadows[K]) => void;
    setCustomCSS: (css: string) => void;
    resetTheme: () => void;
    loadTheme: (theme: Partial<GlobalTheme>) => void;
}

// ─── Radius Presets ─────────────────────────────────────────────────────────

const RADII_PRESETS: Record<RadiusPreset, Omit<ThemeRadii, 'preset'>> = {
    none:    { button: '0px', card: '0px', input: '0px', image: '0px' },
    sharp:   { button: '4px', card: '6px', input: '4px', image: '4px' },
    rounded: { button: '12px', card: '16px', input: '10px', image: '12px' },
    pill:    { button: '9999px', card: '24px', input: '9999px', image: '16px' },
};

// ─── Shadow Presets ─────────────────────────────────────────────────────────

const SHADOW_PRESETS: Record<ShadowPreset, Omit<ThemeShadows, 'preset' | 'custom'>> = {
    none:       { cardShadow: 'none', buttonShadow: 'none' },
    soft:       { cardShadow: '0 2px 12px rgba(0,0,0,0.08)', buttonShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    elevated:   { cardShadow: '0 8px 30px rgba(0,0,0,0.12)', buttonShadow: '0 4px 14px rgba(0,0,0,0.15)' },
    'neon-glow': { cardShadow: '0 0 20px rgba(99,102,241,0.3)', buttonShadow: '0 0 15px rgba(99,102,241,0.4)' },
    'hard-drop': { cardShadow: '6px 6px 0px rgba(0,0,0,0.9)', buttonShadow: '4px 4px 0px rgba(0,0,0,0.9)' },
};

// ─── Default Theme (Neutral Baseline — Not Cyberpunk, Not Minimal) ──────────

const DEFAULT_THEME: GlobalTheme = {
    colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textMuted: '#6B7280',
        border: '#E5E7EB',
    },
    typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        headingWeight: 700,
        bodyWeight: 400,
        baseSize: 16,
        lineHeight: 1.6,
        letterSpacing: 0,
    },
    radii: { preset: 'rounded', ...RADII_PRESETS.rounded },
    shadows: { preset: 'soft', ...SHADOW_PRESETS.soft, custom: '' },
    customCSS: '',
};

// ─── Store Implementation ───────────────────────────────────────────────────

export const useGlobalThemeStore = create<GlobalTheme & GlobalThemeActions>()(
    persist(
        (set) => ({
            ...DEFAULT_THEME,

            setColors: (patch) =>
                set((state) => ({ colors: { ...state.colors, ...patch } })),

            setTypography: (patch) =>
                set((state) => ({ typography: { ...state.typography, ...patch } })),

            setRadii: (preset) =>
                set(() => ({
                    radii: { preset, ...RADII_PRESETS[preset] },
                })),

            setRadiiField: (key, value) =>
                set((state) => ({
                    radii: { ...state.radii, [key]: value },
                })),

            setShadows: (preset) =>
                set((state) => ({
                    shadows: { preset, ...SHADOW_PRESETS[preset], custom: state.shadows.custom },
                })),

            setShadowField: (key, value) =>
                set((state) => ({
                    shadows: { ...state.shadows, [key]: value },
                })),

            setCustomCSS: (css) => set({ customCSS: css }),

            resetTheme: () => set({ ...DEFAULT_THEME }),

            loadTheme: (theme) =>
                set((state) => ({
                    colors: { ...state.colors, ...theme.colors },
                    typography: { ...state.typography, ...theme.typography },
                    radii: theme.radii ? { ...state.radii, ...theme.radii } : state.radii,
                    shadows: theme.shadows ? { ...state.shadows, ...theme.shadows } : state.shadows,
                    customCSS: theme.customCSS ?? state.customCSS,
                })),
        }),
        {
            name: 'omnora-global-theme',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

// ─── Resolved Token Selector (for canvas components) ────────────────────────

/**
 * Resolves a design token value. If a local override is provided, use it.
 * Otherwise, fallback to the global theme value.
 *
 * Usage: resolveToken(localColor, globalTheme.colors.primary)
 */
export function resolveToken<T>(localOverride: T | undefined | null, globalValue: T): T {
    return localOverride !== undefined && localOverride !== null && localOverride !== ''
        ? localOverride
        : globalValue;
}

// ─── Google Fonts Dynamic Loader ────────────────────────────────────────────

const loadedFonts = new Set<string>();

export function loadGoogleFont(fontFamily: string): void {
    if (!fontFamily || loadedFonts.has(fontFamily)) return;

    // System font stacks should not be loaded
    const systemFonts = ['system-ui', 'sans-serif', 'serif', 'monospace', 'cursive'];
    if (systemFonts.some((sf) => fontFamily.toLowerCase().includes(sf))) return;

    const linkId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(linkId)) {
        loadedFonts.add(fontFamily);
        return;
    }

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontFamily);
}

// ─── CSS Variables Generator (Production-Safe Runtime Theming) ──────────────

/**
 * CRITICAL: Tailwind JIT classes are purged at build time on Vercel.
 * Runtime-dynamic values (hex codes, slider values, custom shadows) MUST
 * be rendered as CSS custom properties on DOM elements, NOT as JIT classes.
 *
 * This function converts the entire GlobalTheme into a flat Record of
 * CSS custom properties that can be spread onto `style={{ ... }}`.
 *
 * Usage on canvas root:
 *   <div style={toCSSVariables(useGlobalThemeStore.getState())} />
 *
 * Components then consume via:
 *   style={{ backgroundColor: 'var(--omnora-color-primary)' }}
 */
export function toCSSVariables(theme: GlobalTheme): Record<string, string> {
    return {
        // Colors
        '--omnora-color-primary': theme.colors.primary,
        '--omnora-color-secondary': theme.colors.secondary,
        '--omnora-color-accent': theme.colors.accent,
        '--omnora-color-bg': theme.colors.background,
        '--omnora-color-surface': theme.colors.surface,
        '--omnora-color-text': theme.colors.text,
        '--omnora-color-text-muted': theme.colors.textMuted,
        '--omnora-color-border': theme.colors.border,

        // Typography
        '--omnora-font-heading': `'${theme.typography.headingFont}', system-ui, sans-serif`,
        '--omnora-font-body': `'${theme.typography.bodyFont}', system-ui, sans-serif`,
        '--omnora-font-heading-weight': String(theme.typography.headingWeight),
        '--omnora-font-body-weight': String(theme.typography.bodyWeight),
        '--omnora-font-base-size': `${theme.typography.baseSize}px`,
        '--omnora-line-height': String(theme.typography.lineHeight),
        '--omnora-letter-spacing': `${theme.typography.letterSpacing}em`,

        // Radii
        '--omnora-radius-button': theme.radii.button,
        '--omnora-radius-card': theme.radii.card,
        '--omnora-radius-input': theme.radii.input,
        '--omnora-radius-image': theme.radii.image,

        // Shadows
        '--omnora-shadow-card': theme.shadows.cardShadow,
        '--omnora-shadow-button': theme.shadows.buttonShadow,
        '--omnora-shadow-custom': theme.shadows.custom,
    };
}

/**
 * Resolves inline style for a single element, merging:
 * 1. Global theme CSS variables (as fallback via var())
 * 2. Local overrides directly as inline style values
 *
 * Usage:
 *   const style = resolveInlineStyle(
 *     { bgColor: '#FF0000', borderRadius: '20px' }, // local overrides
 *     globalTheme                                      // global fallback
 *   );
 */
export function resolveInlineStyle(
    localOverrides: Record<string, string | number | undefined>,
    globalFallback: GlobalTheme
): React.CSSProperties {
    const style: Record<string, string | number> = {};

    // Map local override keys to CSS properties with global var() fallbacks
    const keyMap: Record<string, { cssProp: string; varName: string }> = {
        bgColor:       { cssProp: 'backgroundColor', varName: '--omnora-color-primary' },
        textColor:     { cssProp: 'color',           varName: '--omnora-color-text' },
        borderRadius:  { cssProp: 'borderRadius',    varName: '--omnora-radius-button' },
        shadow:        { cssProp: 'boxShadow',       varName: '--omnora-shadow-button' },
        fontFamily:    { cssProp: 'fontFamily',       varName: '--omnora-font-body' },
        borderColor:   { cssProp: 'borderColor',     varName: '--omnora-color-border' },
    };

    for (const [key, mapping] of Object.entries(keyMap)) {
        const local = localOverrides[key];
        if (local !== undefined && local !== null && local !== '') {
            style[mapping.cssProp] = local;
        } else {
            style[mapping.cssProp] = `var(${mapping.varName})`;
        }
    }

    return style as React.CSSProperties;
}
