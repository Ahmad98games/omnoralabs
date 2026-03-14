/**
 * StyleEditorPanel: Granular CSS Controls
 *
 * Dispatches to `node.styles` or `node.responsive.[viewport]` based on current builder state.
 */
import React, { useMemo, useCallback } from 'react';
import { dispatcher } from '../../platform/core/Dispatcher';
import { useNodeSelector } from '../../hooks/useNodeSelector';
import { useBuilder } from '../../context/BuilderContext';
import {
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type, LayoutGrid, BoxSelect, Sparkles, Play
} from 'lucide-react';

interface StyleEditorProps {
    nodeId: string;
}

// ─── Animation Presets ────────────────────────────────────────────────────────

const ANIMATION_TYPES = [
    { value: 'none', label: '— None —' },
    { value: 'fadeIn', label: 'Fade In' },
    { value: 'slideUp', label: 'Slide Up' },
    { value: 'zoomIn', label: 'Zoom In' },
    { value: 'blurReveal', label: 'Blur Reveal' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export const StyleEditorPanel: React.FC<StyleEditorProps> = ({ nodeId }) => {
    const { viewport } = useBuilder();
    const node = useNodeSelector(nodeId, n => ({
        styles: n.styles,
        responsive: n.responsive,
        animations: n.animations,
        animationPreviewKey: n.animationPreviewKey,
    }));

    // Resolve the active style object based on viewport override logic
    const activeStyles = useMemo(() => {
        if (!node) return {};
        // Base styles
        const base = node.styles || {};
        // If on desktop, deal with base directly
        if (viewport === 'desktop') return base;
        // If tablet/mobile, layered on top of base
        return { ...base, ...node.responsive?.[viewport] };
    }, [node, viewport]);

    const handleStyleChange = useCallback((property: string, value: string) => {
        if (!node) return;

        // Where are we writing this value to?
        let path = '';
        if (viewport === 'desktop') {
            path = `styles.${property}`;
        } else {
            // Mobile or Tablet.
            // Explicitly ensure the `responsive` and `responsive.[viewport]` objects exist
            // Immutable set in dispatcher will handle missing parent objects safely if structure is standard,
            // but for safety we define the exact path:
            path = `responsive.${viewport}.${property}`;
        }

        dispatcher.dispatch({
            nodeId,
            path,
            value,
            type: 'visual',
            source: 'editor'
        });
    }, [nodeId, viewport, node]);

    const handleAnimationChange = useCallback((property: string, value: string | number | boolean) => {
        dispatcher.dispatch({
            nodeId,
            path: `animations.${property}`,
            value,
            type: 'visual',
            source: 'editor'
        });
    }, [nodeId]);

    const handlePlayPreview = useCallback(() => {
        // Dispatch an ephemeral key change — ComponentWrapper watches this to re-trigger the animation
        dispatcher.dispatch({
            nodeId,
            path: 'animationPreviewKey',
            value: Date.now(),
            type: 'visual',
            source: 'editor'
        });
    }, [nodeId]);

    if (!node) return null;

    const anim = node.animations || { type: 'none', duration: 600, delay: 0, once: true };

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            color: '#e4e4e7',
            display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
            {/* Context Badge */}
            <div style={{
                fontSize: '11px', padding: '6px 10px',
                background: 'rgba(124, 109, 250, 0.1)',
                border: '1px solid rgba(124, 109, 250, 0.2)',
                borderRadius: '6px', color: '#a78bfa',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <span style={{ fontWeight: 600 }}>Editing Style At:</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                    {viewport}
                </span>
            </div>

            {/* Typography Section */}
            <Section title="Typography" icon={<Type size={14} />}>
                <GridTwoCol>
                    <LabelInput
                        label="Font Size"
                        value={activeStyles.fontSize || ''}
                        placeholder="e.g. 16px, 1.2rem"
                        onChange={(v) => handleStyleChange('fontSize', v)}
                    />
                    <LabelInput
                        label="Font Weight"
                        value={activeStyles.fontWeight || ''}
                        placeholder="e.g. 400, bold"
                        onChange={(v) => handleStyleChange('fontWeight', v)}
                    />
                    <LabelInput
                        label="Color"
                        value={activeStyles.color || ''}
                        placeholder="#fff or rgba(...)"
                        onChange={(v) => handleStyleChange('color', v)}
                    />
                    <LabelInput
                        label="Line Height"
                        value={activeStyles.lineHeight || ''}
                        placeholder="e.g. 1.5"
                        onChange={(v) => handleStyleChange('lineHeight', v)}
                    />
                </GridTwoCol>

                <Label style={{ marginTop: 12 }}>Alignment</Label>
                <div style={{ display: 'flex', gap: 4, background: '#18181b', padding: 4, borderRadius: 6, width: 'fit-content' }}>
                    <IconButton
                        active={activeStyles.textAlign === 'left'}
                        onClick={() => handleStyleChange('textAlign', 'left')}
                    ><AlignLeft size={14} /></IconButton>
                    <IconButton
                        active={activeStyles.textAlign === 'center'}
                        onClick={() => handleStyleChange('textAlign', 'center')}
                    ><AlignCenter size={14} /></IconButton>
                    <IconButton
                        active={activeStyles.textAlign === 'right'}
                        onClick={() => handleStyleChange('textAlign', 'right')}
                    ><AlignRight size={14} /></IconButton>
                    <IconButton
                        active={activeStyles.textAlign === 'justify'}
                        onClick={() => handleStyleChange('textAlign', 'justify')}
                    ><AlignJustify size={14} /></IconButton>
                </div>
            </Section>

            {/* Layout & Spacing */}
            <Section title="Spacing (Margin & Padding)" icon={<LayoutGrid size={14} />}>
                <GridTwoCol>
                    <LabelInput label="Padding (Inner)" value={activeStyles.padding || ''} placeholder="10px 20px" onChange={(v) => handleStyleChange('padding', v)} />
                    <LabelInput label="Margin (Outer)" value={activeStyles.margin || ''} placeholder="10px auto" onChange={(v) => handleStyleChange('margin', v)} />
                </GridTwoCol>
                <Label style={{ marginTop: 12, marginBottom: 4 }}>Dimensions</Label>
                <GridTwoCol>
                    <LabelInput label="Width" value={activeStyles.width || ''} placeholder="100%, 300px" onChange={(v) => handleStyleChange('width', v)} />
                    <LabelInput label="Height" value={activeStyles.height || ''} placeholder="auto" onChange={(v) => handleStyleChange('height', v)} />
                </GridTwoCol>
            </Section>

            {/* Borders & Backgrounds */}
            <Section title="Appearance" icon={<BoxSelect size={14} />}>
                <LabelInput
                    label="Background"
                    value={activeStyles.background || activeStyles.backgroundColor || ''}
                    placeholder="Color, transparent, or gradient"
                    onChange={(v) => handleStyleChange('background', v)}
                    style={{ marginBottom: 12 }}
                />
                <GridTwoCol>
                    <LabelInput label="Border Radius" value={activeStyles.borderRadius || ''} placeholder="e.g. 8px, 50%" onChange={(v) => handleStyleChange('borderRadius', v)} />
                    <LabelInput label="Border" value={activeStyles.border || ''} placeholder="1px solid #333" onChange={(v) => handleStyleChange('border', v)} />
                    <LabelInput label="Opacity" value={activeStyles.opacity || ''} placeholder="0-1" onChange={(v) => handleStyleChange('opacity', v)} />
                    <LabelInput label="Box Shadow" value={activeStyles.boxShadow || ''} placeholder="0px 4px 10px rgba(...)" onChange={(v) => handleStyleChange('boxShadow', v)} />
                </GridTwoCol>
            </Section>

            {/* ─── Animations Section (Phase 12) ─────────────────────────────── */}
            <Section title="Entrance Animation" icon={<Sparkles size={14} />}>
                <Label>Type</Label>
                <select
                    value={anim.type}
                    onChange={(e) => handleAnimationChange('type', e.target.value)}
                    style={{
                        width: '100%', padding: '6px 8px', fontSize: '12px',
                        background: '#18181b', border: '1px solid #27272a',
                        borderRadius: '4px', color: '#f4f4f5', fontFamily: 'monospace',
                        marginBottom: 12, cursor: 'pointer'
                    }}
                >
                    {ANIMATION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>

                <GridTwoCol>
                    <LabelInput
                        label="Duration (ms)"
                        value={String(anim.duration ?? 600)}
                        placeholder="600"
                        onChange={(v) => handleAnimationChange('duration', Number(v) || 600)}
                    />
                    <LabelInput
                        label="Delay (ms)"
                        value={String(anim.delay ?? 0)}
                        placeholder="0"
                        onChange={(v) => handleAnimationChange('delay', Number(v) || 0)}
                    />
                </GridTwoCol>

                {/* ▶ Play Preview Button */}
                <button
                    onClick={handlePlayPreview}
                    style={{
                        marginTop: 16, width: '100%', padding: '10px',
                        background: 'linear-gradient(135deg, #7c6dfa 0%, #a78bfa 100%)',
                        border: 'none', borderRadius: '6px',
                        color: '#fff', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                        transition: 'opacity 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                    <Play size={14} fill="#fff" /> PLAY PREVIEW
                </button>
            </Section>
        </div>
    );
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div style={{
        background: '#0e0e11', border: '1px solid #27272a',
        borderRadius: '8px', padding: '16px'
    }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '16px', color: '#e4e4e7', fontSize: '13px', fontWeight: 600
        }}>
            <span style={{ color: '#a1a1aa' }}>{icon}</span> {title}
        </div>
        {children}
    </div>
);

const GridTwoCol: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {children}
    </div>
);

const Label: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, style, ...props }) => (
    <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', ...style }} {...props}>
        {children}
    </div>
);

const LabelInput: React.FC<{ label: string, value: string, placeholder?: string, onChange: (val: string) => void, style?: React.CSSProperties }> = ({ label, value, placeholder, onChange, style }) => (
    <div style={style}>
        <Label>{label}</Label>
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: '100%', padding: '6px 8px', fontSize: '12px',
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: '4px', color: '#f4f4f5', fontFamily: 'monospace'
            }}
        />
    </div>
);

const IconButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        style={{
            padding: '6px',
            background: active ? '#3f3f46' : 'transparent',
            border: 'none', borderRadius: '4px',
            color: active ? '#fff' : '#a1a1aa',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease'
        }}
    >
        {children}
    </button>
);
