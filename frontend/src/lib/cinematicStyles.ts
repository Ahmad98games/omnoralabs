/**
 * cinematicStyles.ts — Pure CSS Post-Processing Engine
 *
 * Translates an AST `effects` configuration into raw, high-performance
 * CSS styles that simulate WebGL-grade visual effects using only:
 *  - Layered `text-shadow` / `drop-shadow` (Neon Bloom / HDR Glow)
 *  - `backdrop-filter: blur()` + border + opacity (Glassmorphism Depth)
 *  - CSS custom properties for runtime theming
 *  - `will-change` hints for GPU compositing
 *
 * PERFORMANCE CONTRACT:
 *  - Zero JavaScript animation loops — all effects are CSS-driven
 *  - No runtime DOM queries — pure style object generation
 *  - No external dependencies — zero bundle cost
 *  - All transforms use GPU-composited CSS properties
 *
 * USAGE:
 *  const styles = generateCinematicStyles({
 *    neonBloom: { enabled: true, color: '#00FFFF', intensity: 'high' },
 *    glassmorphism: { enabled: true, blur: 16, opacity: 0.08 },
 *  });
 *  <div style={styles.container} />
 */

// ─── AST Effects Configuration Types ────────────────────────────────────────

export type BloomIntensity = 'subtle' | 'medium' | 'high' | 'extreme';

export interface NeonBloomConfig {
    enabled: boolean;
    /** The glow color. Any CSS color value. */
    color: string;
    /** Intensity presets controlling shadow layer count and spread. */
    intensity: BloomIntensity;
    /** Optional secondary color for dual-tone bloom. */
    secondaryColor?: string;
    /** Apply bloom to text (text-shadow) or box (box-shadow). Default: 'box'. */
    target?: 'text' | 'box' | 'both';
}

export interface GlassmorphismConfig {
    enabled: boolean;
    /** Backdrop blur radius in px. Default: 12. */
    blur: number;
    /** Background opacity (0–1). Default: 0.08. */
    opacity: number;
    /** Background tint color. Default: '#FFFFFF'. */
    tint?: string;
    /** Border opacity (0–1). Default: 0.15. */
    borderOpacity?: number;
    /** Enable inner shadow for depth. Default: false. */
    innerShadow?: boolean;
    /** Enable frosted grain texture overlay. Default: false. */
    grainOverlay?: boolean;
}

export interface ChromaticAberrationConfig {
    enabled: boolean;
    /** Offset in px for the RGB channel split. Default: 2. */
    offset: number;
}

export interface CinematicEffectsConfig {
    neonBloom?: NeonBloomConfig;
    glassmorphism?: GlassmorphismConfig;
    chromaticAberration?: ChromaticAberrationConfig;
}

// ─── Generated Styles Output ────────────────────────────────────────────────

export interface CinematicStylesOutput {
    container: React.CSSProperties;
    textGlow?: React.CSSProperties;
    glareOverlay?: React.CSSProperties;
    /** Raw CSS string for injection into <style> tags (grain textures, etc.) */
    rawCSS?: string;
}

// ─── Neon Bloom Shadow Layer Generator ──────────────────────────────────────

const BLOOM_LAYERS: Record<BloomIntensity, number[][]> = {
    subtle: [
        [0, 0, 8, 0],
        [0, 0, 20, -2],
    ],
    medium: [
        [0, 0, 6, 0],
        [0, 0, 16, -1],
        [0, 0, 40, -4],
    ],
    high: [
        [0, 0, 4, 0],
        [0, 0, 12, 0],
        [0, 0, 30, -2],
        [0, 0, 60, -6],
    ],
    extreme: [
        [0, 0, 4, 1],
        [0, 0, 10, 0],
        [0, 0, 20, 0],
        [0, 0, 45, -3],
        [0, 0, 80, -8],
        [0, 0, 120, -12],
    ],
};

function generateBloomShadows(color: string, intensity: BloomIntensity): string {
    const layers = BLOOM_LAYERS[intensity];
    return layers
        .map(([x, y, blur, spread]) => `${x}px ${y}px ${blur}px ${spread}px ${color}`)
        .join(', ');
}

function generateTextBloomShadows(color: string, intensity: BloomIntensity): string {
    // text-shadow doesn't support spread, so we use a simpler signature
    const configs: Record<BloomIntensity, number[][]> = {
        subtle: [[0, 0, 8], [0, 0, 20]],
        medium: [[0, 0, 6], [0, 0, 16], [0, 0, 40]],
        high: [[0, 0, 4], [0, 0, 12], [0, 0, 30], [0, 0, 60]],
        extreme: [[0, 0, 4], [0, 0, 10], [0, 0, 20], [0, 0, 45], [0, 0, 80]],
    };
    return configs[intensity]
        .map(([x, y, blur]) => `${x}px ${y}px ${blur}px ${color}`)
        .join(', ');
}

// ─── Glassmorphism Generator ────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Main Generator Function ────────────────────────────────────────────────

export function generateCinematicStyles(
    config: CinematicEffectsConfig
): CinematicStylesOutput {
    const container: React.CSSProperties = {};
    const textGlow: React.CSSProperties = {};
    let glareOverlay: React.CSSProperties | undefined;
    const rawCSSParts: string[] = [];

    // ── Neon Bloom ──────────────────────────────────────────────────────

    if (config.neonBloom?.enabled) {
        const { color, intensity, secondaryColor, target = 'box' } = config.neonBloom;

        const primaryBloom = generateBloomShadows(color, intensity);
        const dualBloom = secondaryColor
            ? `${primaryBloom}, ${generateBloomShadows(secondaryColor, intensity)}`
            : primaryBloom;

        if (target === 'box' || target === 'both') {
            container.boxShadow = dualBloom;
        }

        if (target === 'text' || target === 'both') {
            const textPrimaryBloom = generateTextBloomShadows(color, intensity);
            const textDualBloom = secondaryColor
                ? `${textPrimaryBloom}, ${generateTextBloomShadows(secondaryColor, intensity)}`
                : textPrimaryBloom;
            textGlow.textShadow = textDualBloom;
            textGlow.color = color;
        }

        // GPU hint for shadow compositing
        container.willChange = 'box-shadow, transform';
    }

    // ── Glassmorphism Depth ──────────────────────────────────────────────

    if (config.glassmorphism?.enabled) {
        const {
            blur = 12,
            opacity = 0.08,
            tint = '#FFFFFF',
            borderOpacity = 0.15,
            innerShadow = false,
            grainOverlay = false,
        } = config.glassmorphism;

        container.backdropFilter = `blur(${blur}px) saturate(180%)`;
        container.WebkitBackdropFilter = `blur(${blur}px) saturate(180%)`;
        container.backgroundColor = hexToRgba(tint, opacity);
        container.border = `1px solid ${hexToRgba(tint, borderOpacity)}`;

        if (innerShadow) {
            const existingShadow = container.boxShadow || '';
            const inner = `inset 0 1px 0 ${hexToRgba(tint, 0.1)}, inset 0 -1px 0 ${hexToRgba('#000000', 0.05)}`;
            container.boxShadow = existingShadow
                ? `${existingShadow}, ${inner}`
                : inner;
        }

        // Grain texture via noise SVG (ultra-lightweight, no external file)
        if (grainOverlay) {
            rawCSSParts.push(`
                .omnora-grain::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    opacity: 0.03;
                    pointer-events: none;
                    z-index: 1;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                    background-size: 128px 128px;
                }
            `);
        }

        container.willChange = container.willChange
            ? `${container.willChange}, backdrop-filter`
            : 'backdrop-filter';
    }

    // ── Chromatic Aberration (CSS Filter Trick) ─────────────────────────

    if (config.chromaticAberration?.enabled) {
        const { offset } = config.chromaticAberration;

        // Simulated via CSS text-shadow RGB channel split
        rawCSSParts.push(`
            .omnora-chromatic {
                position: relative;
            }
            .omnora-chromatic::before,
            .omnora-chromatic::after {
                content: attr(data-text);
                position: absolute;
                inset: 0;
                pointer-events: none;
            }
            .omnora-chromatic::before {
                color: rgba(255, 0, 0, 0.5);
                transform: translate(-${offset}px, 0);
                mix-blend-mode: screen;
            }
            .omnora-chromatic::after {
                color: rgba(0, 0, 255, 0.5);
                transform: translate(${offset}px, 0);
                mix-blend-mode: screen;
            }
        `);
    }

    // ── Assemble Output ─────────────────────────────────────────────────

    return {
        container,
        textGlow: Object.keys(textGlow).length > 0 ? textGlow : undefined,
        glareOverlay,
        rawCSS: rawCSSParts.length > 0 ? rawCSSParts.join('\n') : undefined,
    };
}

// ─── Preset Library (Quick-apply cinematic presets) ──────────────────────────

export const CINEMATIC_PRESETS: Record<string, CinematicEffectsConfig> = {
    'neon-cyberpunk': {
        neonBloom: { enabled: true, color: '#00FFFF', intensity: 'high', target: 'both' },
        glassmorphism: { enabled: true, blur: 16, opacity: 0.05, tint: '#000000', borderOpacity: 0.1, innerShadow: true },
    },
    'neon-gaming': {
        neonBloom: { enabled: true, color: '#FF00FF', secondaryColor: '#00FF88', intensity: 'extreme', target: 'box' },
        glassmorphism: { enabled: true, blur: 20, opacity: 0.03, tint: '#0A0A0A', borderOpacity: 0.08 },
    },
    'luxury-glass': {
        neonBloom: { enabled: false, color: '#D4AF37', intensity: 'subtle' },
        glassmorphism: { enabled: true, blur: 24, opacity: 0.1, tint: '#FFFFFF', borderOpacity: 0.2, innerShadow: true, grainOverlay: true },
    },
    'minimal-frost': {
        glassmorphism: { enabled: true, blur: 10, opacity: 0.06, tint: '#F8FAFC', borderOpacity: 0.12 },
    },
    'hdr-bloom': {
        neonBloom: { enabled: true, color: '#6366F1', secondaryColor: '#EC4899', intensity: 'medium', target: 'box' },
    },
    'retro-arcade': {
        neonBloom: { enabled: true, color: '#FF0044', intensity: 'extreme', target: 'both' },
        chromaticAberration: { enabled: true, offset: 3 },
    },
};

// ─── Style Injector Utility ─────────────────────────────────────────────────

let injectedStyleElement: HTMLStyleElement | null = null;

export function injectCinematicCSS(rawCSS: string): void {
    if (!rawCSS) return;

    if (!injectedStyleElement) {
        injectedStyleElement = document.createElement('style');
        injectedStyleElement.id = 'omnora-cinematic-engine';
        injectedStyleElement.setAttribute('data-omnora', 'cinematic');
        document.head.appendChild(injectedStyleElement);
    }

    injectedStyleElement.textContent = rawCSS;
}
