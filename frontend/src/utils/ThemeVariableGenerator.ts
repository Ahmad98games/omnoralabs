/**
 * ThemeVariableGenerator: Scoped CSS & Dynamic Theming Systems
 * 
 * Transforms database theme_vars into CSS values and resolves adaptive contrasts.
 */

export interface ThemeVars {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
}

/**
 * getContrastColor: Adaptive Contrast Solver using YIQ-space
 * If background is dark, returns text color white, otherwise black.
 */
export function getContrastColor(hexColor: string): 'white' | 'black' {
    if (!hexColor || !hexColor.startsWith('#')) return 'white'; // Fallback
    
    const cleanHex = hexColor.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // YIQ contrast formula
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

/**
 * DynamicFontLoader: Injects Google Fonts safely without duplicating loads on Client loops.
 */
export function loadGoogleFont(fontFamily: string) {
    if (typeof window === 'undefined' || !fontFamily) return;

    const fontId = `omnora-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) return; // Already loaded

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;700;900&display=swap`;
    
    document.head.appendChild(link);
}

/**
 * generates scoped component inline variables merging adaptive variables flawless
 */
export function generateScopedTheme(themeVars: ThemeVars, nodeType?: string): Record<string, string> {
    const bg = themeVars.backgroundColor || '#ffffff';
    const textContrast = getContrastColor(bg);

    return {
        '--omnora-bg': bg,
        '--omnora-primary': themeVars.primaryColor || '#7c6dfa',
        '--omnora-text': themeVars.textColor || (textContrast === 'white' ? '#f4f4f5' : '#18181b'),
        '--omnora-font': themeVars.fontFamily || "'Inter', sans-serif",
    };
}
