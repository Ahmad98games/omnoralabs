/**
 * GlobalSettingsPanel.tsx — Theme-Agnostic Design Token Editor
 *
 * Right Inspector panel for configuring the store's foundational
 * visual identity. Merchants can build ANY aesthetic:
 * Neon gaming, minimalist white, dark luxury, brutalist, etc.
 *
 * ARCHITECTURE:
 *  - Reads/writes exclusively to the GlobalTheme Zustand store.
 *  - Triggers dynamic Google Font injection on font change.
 *  - Zero coupling to any specific aesthetic.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Palette, Type, Square, Sun, RotateCcw,
    ChevronDown, ChevronRight, Code2, Sparkles,
} from 'lucide-react';
import {
    useGlobalThemeStore,
    loadGoogleFont,
    type RadiusPreset,
    type ShadowPreset,
} from '../../stores/useGlobalThemeStore';

// ─── Color Swatch Component ─────────────────────────────────────────────────

const ColorSwatch: React.FC<{
    label: string;
    value: string;
    onChange: (hex: string) => void;
}> = React.memo(({ label, value, onChange }) => (
    <div className="flex items-center gap-3 group">
        <div className="relative">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
            />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,8}$/.test(v)) onChange(v);
                }}
                className="w-full bg-transparent border-none text-xs text-gray-300 font-mono focus:outline-none focus:text-white p-0 mt-0.5"
                spellCheck={false}
            />
        </div>
    </div>
));
ColorSwatch.displayName = 'ColorSwatch';

// ─── Collapsible Section Component ──────────────────────────────────────────

const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-white/5 last:border-b-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex-1">{title}</span>
                {open ? <ChevronDown size={12} className="text-gray-600" /> : <ChevronRight size={12} className="text-gray-600" />}
            </button>
            {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
        </div>
    );
};

// ─── Preset Button Component ────────────────────────────────────────────────

const PresetButton: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
    preview?: React.ReactNode;
}> = ({ label, active, onClick, preview }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border
            ${active
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-transparent border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400'
            }`}
    >
        {preview}
        {label}
    </button>
);

// ─── Font Input Component ───────────────────────────────────────────────────

const POPULAR_FONTS = [
    'Inter', 'Poppins', 'Roboto', 'Outfit', 'Montserrat',
    'Cinzel', 'Orbitron', 'Playfair Display', 'Space Grotesk',
    'DM Sans', 'Work Sans', 'Raleway', 'Nunito', 'Lora',
    'Fira Code', 'JetBrains Mono', 'Pacifico', 'Bebas Neue',
];

const FontInput: React.FC<{
    label: string;
    value: string;
    onChange: (font: string) => void;
}> = React.memo(({ label, value, onChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const handleSelect = useCallback((font: string) => {
        onChange(font);
        loadGoogleFont(font);
        setShowDropdown(false);
    }, [onChange]);

    return (
        <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    style={{ fontFamily: value }}
                    placeholder="Type or select a font..."
                />
                {showDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                        {POPULAR_FONTS.filter((f) => f.toLowerCase().includes(value.toLowerCase())).map((font) => (
                            <button
                                key={font}
                                onMouseDown={() => handleSelect(font)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-indigo-500/10 hover:text-white transition-colors"
                                style={{ fontFamily: font }}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
FontInput.displayName = 'FontInput';

// ─── Main Panel Component ───────────────────────────────────────────────────

export const GlobalSettingsPanel: React.FC = () => {
    const colors = useGlobalThemeStore((s) => s.colors);
    const typography = useGlobalThemeStore((s) => s.typography);
    const radii = useGlobalThemeStore((s) => s.radii);
    const shadows = useGlobalThemeStore((s) => s.shadows);
    const customCSS = useGlobalThemeStore((s) => s.customCSS);
    const setColors = useGlobalThemeStore((s) => s.setColors);
    const setTypography = useGlobalThemeStore((s) => s.setTypography);
    const setRadii = useGlobalThemeStore((s) => s.setRadii);
    const setShadows = useGlobalThemeStore((s) => s.setShadows);
    const setCustomCSS = useGlobalThemeStore((s) => s.setCustomCSS);
    const resetTheme = useGlobalThemeStore((s) => s.resetTheme);

    // Load current fonts on mount
    useEffect(() => {
        loadGoogleFont(typography.headingFont);
        loadGoogleFont(typography.bodyFont);
    }, [typography.headingFont, typography.bodyFont]);

    const radiusPresets: RadiusPreset[] = ['none', 'sharp', 'rounded', 'pill'];
    const shadowPresets: ShadowPreset[] = ['none', 'soft', 'elevated', 'neon-glow', 'hard-drop'];

    return (
        <div className="h-full overflow-y-auto bg-[#0A0A0A] text-white">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-300">
                        Global Site Design
                    </h3>
                </div>
                <button
                    onClick={resetTheme}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5"
                    title="Reset to defaults"
                >
                    <RotateCcw size={13} />
                </button>
            </div>

            {/* ── Colors ── */}
            <Section title="Color Palette" icon={<Palette size={13} className="text-indigo-400" />}>
                <div className="grid grid-cols-2 gap-3">
                    <ColorSwatch label="Primary" value={colors.primary} onChange={(v) => setColors({ primary: v })} />
                    <ColorSwatch label="Secondary" value={colors.secondary} onChange={(v) => setColors({ secondary: v })} />
                    <ColorSwatch label="Accent" value={colors.accent} onChange={(v) => setColors({ accent: v })} />
                    <ColorSwatch label="Background" value={colors.background} onChange={(v) => setColors({ background: v })} />
                    <ColorSwatch label="Surface" value={colors.surface} onChange={(v) => setColors({ surface: v })} />
                    <ColorSwatch label="Text" value={colors.text} onChange={(v) => setColors({ text: v })} />
                    <ColorSwatch label="Text Muted" value={colors.textMuted} onChange={(v) => setColors({ textMuted: v })} />
                    <ColorSwatch label="Border" value={colors.border} onChange={(v) => setColors({ border: v })} />
                </div>
            </Section>

            {/* ── Typography ── */}
            <Section title="Typography" icon={<Type size={13} className="text-indigo-400" />}>
                <FontInput
                    label="Heading Font"
                    value={typography.headingFont}
                    onChange={(v) => {
                        setTypography({ headingFont: v });
                        loadGoogleFont(v);
                    }}
                />
                <FontInput
                    label="Body Font"
                    value={typography.bodyFont}
                    onChange={(v) => {
                        setTypography({ bodyFont: v });
                        loadGoogleFont(v);
                    }}
                />
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Heading Weight</label>
                        <select
                            value={typography.headingWeight}
                            onChange={(e) => setTypography({ headingWeight: Number(e.target.value) })}
                            className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        >
                            {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Base Size</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={typography.baseSize}
                                onChange={(e) => setTypography({ baseSize: Number(e.target.value) || 16 })}
                                min={10}
                                max={24}
                                className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500/50 transition-all"
                            />
                            <span className="text-[10px] text-gray-600 font-mono">px</span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Corner Radius ── */}
            <Section title="Corner Style" icon={<Square size={13} className="text-indigo-400" />} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                    {radiusPresets.map((preset) => (
                        <PresetButton
                            key={preset}
                            label={preset}
                            active={radii.preset === preset}
                            onClick={() => setRadii(preset)}
                            preview={
                                <div
                                    className="w-4 h-4 border border-current"
                                    style={{
                                        borderRadius: preset === 'none' ? '0' : preset === 'sharp' ? '2px' : preset === 'rounded' ? '6px' : '9999px',
                                    }}
                                />
                            }
                        />
                    ))}
                </div>
            </Section>

            {/* ── Shadows ── */}
            <Section title="Shadow Style" icon={<Sun size={13} className="text-indigo-400" />} defaultOpen={false}>
                <div className="grid grid-cols-1 gap-2">
                    {shadowPresets.map((preset) => (
                        <PresetButton
                            key={preset}
                            label={preset}
                            active={shadows.preset === preset}
                            onClick={() => setShadows(preset)}
                        />
                    ))}
                </div>
            </Section>

            {/* ── Custom CSS ── */}
            <Section title="Custom CSS" icon={<Code2 size={13} className="text-amber-400" />} defaultOpen={false}>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                    Inject raw Tailwind classes or custom CSS. Power users only.
                </p>
                <textarea
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    rows={6}
                    placeholder={`.my-custom-section {\n  background: linear-gradient(...);\n}`}
                    spellCheck={false}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-[11px] text-emerald-400 font-mono placeholder-gray-700
                        focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none"
                />
            </Section>
        </div>
    );
};

export default GlobalSettingsPanel;
