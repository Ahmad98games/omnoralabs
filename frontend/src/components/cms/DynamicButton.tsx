/**
 * DynamicButton.tsx — Theme-Inheriting Canvas Component
 *
 * Demonstrates the COMPONENT INHERITANCE pattern:
 *  1. By default, reads colors, radii, shadows, and typography from GlobalTheme.
 *  2. Accepts optional LOCAL overrides via node props from the Inspector.
 *  3. Accepts optional `customStyles` for runtime dynamic values.
 *
 * ⚠ TAILWIND PURGE TRAP (CTO-MANDATED FIX):
 *  Runtime-dynamic values (custom hex codes, slider-driven blur/shadows)
 *  MUST be rendered as INLINE STYLES, NOT Tailwind JIT classes.
 *  Tailwind classes are purged at build time on Vercel — JIT classes
 *  typed by merchants at runtime will NOT generate CSS.
 *
 *  ✅ SAFE:  style={{ backgroundColor: '#FF007F' }}
 *  ✅ SAFE:  style={{ boxShadow: '0 0 15px #FF007F' }}
 *  ❌ UNSAFE: className="bg-[#FF007F]" (purged in production)
 *  ❌ UNSAFE: className="drop-shadow-[0_0_15px_#FF007F]" (purged)
 *
 *  `staticClasses` accepts ONLY pre-defined, build-safe Tailwind classes
 *  like `flex`, `p-4`, `rounded-lg` that exist in the safelist or source.
 */

import React, { useMemo } from 'react';
import { useGlobalThemeStore, resolveToken } from '../../stores/useGlobalThemeStore';

// ─── Props Interface (matches BuilderNode.props shape) ──────────────────────

export interface DynamicButtonProps {
    // Content
    label?: string;
    icon?: string;       // emoji or lucide icon name (future)
    size?: 'sm' | 'md' | 'lg';

    // ── Local Overrides (break from global theme if set) ──
    bgColor?: string;
    textColor?: string;
    hoverBgColor?: string;
    borderRadius?: string;
    shadow?: string;
    fontFamily?: string;
    fontWeight?: number;
    borderWidth?: string;
    borderColor?: string;

    // ── Runtime Custom Styles (production-safe) ──
    /** Inline CSS overrides for runtime-dynamic values. Use this for
     *  merchant-authored custom hex codes, blur, shadows etc. */
    customStyles?: React.CSSProperties;

    /** ONLY pre-defined build-safe Tailwind classes (flex, p-4, etc.).
     *  Do NOT pass runtime JIT classes here. */
    staticClasses?: string;

    // ── Canvas Integration ──
    onClick?: () => void;
    isSelected?: boolean;
    nodeId?: string;
}

// ─── Size Presets ───────────────────────────────────────────────────────────

const SIZE_MAP = {
    sm: { px: '16px', py: '8px', fontSize: '13px' },
    md: { px: '24px', py: '12px', fontSize: '15px' },
    lg: { px: '36px', py: '16px', fontSize: '17px' },
} as const;

// ─── Component ──────────────────────────────────────────────────────────────

export const DynamicButton: React.FC<DynamicButtonProps> = React.memo(({
    label = 'Button',
    icon,
    size = 'md',
    bgColor,
    textColor,
    hoverBgColor,
    borderRadius,
    shadow,
    fontFamily,
    fontWeight,
    borderWidth,
    borderColor,
    customStyles,
    staticClasses = '',
    onClick,
    isSelected = false,
}) => {
    // ── Read Global Theme (atomic selectors — no wasted re-renders) ──
    const globalColors = useGlobalThemeStore((s) => s.colors);
    const globalRadii = useGlobalThemeStore((s) => s.radii);
    const globalShadows = useGlobalThemeStore((s) => s.shadows);
    const globalTypography = useGlobalThemeStore((s) => s.typography);

    // ── Resolve: local override → global fallback (ALL via inline styles) ──
    const resolvedBg = resolveToken(bgColor, globalColors.primary);
    const resolvedText = resolveToken(textColor, '#FFFFFF');
    const resolvedRadius = resolveToken(borderRadius, globalRadii.button);
    const resolvedShadow = resolveToken(shadow, globalShadows.buttonShadow);
    const resolvedFont = resolveToken(fontFamily, globalTypography.bodyFont);
    const resolvedWeight = resolveToken(fontWeight, 600);
    const resolvedBorderWidth = resolveToken(borderWidth, '0px');
    const resolvedBorderColor = resolveToken(borderColor, globalColors.border);
    const resolvedHoverBg = hoverBgColor || adjustBrightness(resolvedBg, -15);

    const sizeConfig = SIZE_MAP[size];

    // ── Computed Inline Styles (production-safe: no JIT dependency) ──
    const computedStyle = useMemo(
        (): React.CSSProperties => ({
            // All dynamic values are inline — immune to Tailwind purge
            backgroundColor: resolvedBg,
            color: resolvedText,
            borderRadius: resolvedRadius,
            boxShadow: resolvedShadow,
            fontFamily: `'${resolvedFont}', system-ui, sans-serif`,
            fontWeight: resolvedWeight,
            fontSize: sizeConfig.fontSize,
            paddingLeft: sizeConfig.px,
            paddingRight: sizeConfig.px,
            paddingTop: sizeConfig.py,
            paddingBottom: sizeConfig.py,
            border: `${resolvedBorderWidth} solid ${resolvedBorderColor}`,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: isSelected ? '2px solid #6366F1' : 'none',
            outlineOffset: isSelected ? '2px' : '0',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            // Merge merchant's runtime custom styles (inline — purge-safe)
            ...customStyles,
        }),
        [resolvedBg, resolvedText, resolvedRadius, resolvedShadow, resolvedFont,
         resolvedWeight, sizeConfig, resolvedBorderWidth, resolvedBorderColor,
         isSelected, customStyles]
    );

    // ── Hover Handler (CSS-in-JS hover state) ──
    const [isHovered, setIsHovered] = React.useState(false);

    const activeStyle = useMemo(
        (): React.CSSProperties =>
            isHovered
                ? { ...computedStyle, backgroundColor: resolvedHoverBg, transform: 'translateY(-1px)' }
                : computedStyle,
        [isHovered, computedStyle, resolvedHoverBg]
    );

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={activeStyle}
            className={staticClasses}
            data-omnora-component="dynamic-button"
        >
            {icon && <span>{icon}</span>}
            {label}
        </button>
    );
});

DynamicButton.displayName = 'DynamicButton';

// ─── Utility: Adjust hex color brightness ───────────────────────────────────

function adjustBrightness(hex: string, percent: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + Math.round(255 * (percent / 100))));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + Math.round(255 * (percent / 100))));
    const b = Math.min(255, Math.max(0, (num & 0xFF) + Math.round(255 * (percent / 100))));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default DynamicButton;
