import React from 'react';
import { useOmnora } from '../../client/OmnoraContext';
import {
    Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    Columns, SplitSquareHorizontal, Maximize2, MousePointer2
} from 'lucide-react';

// ─── Shared UI ────────────────────────────────────────────────────────────────
const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <span style={{ fontSize: 9, fontWeight: 900, color: '#6366F1', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        {icon} {children}
    </span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>{children}</span>
);

const Slider = ({ label, value, min = 0, max = 100, unit = 'px', onChange }: any) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Label>{label}</Label>
            <span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{value || 0}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={parseInt(value) || 0}
            onChange={e => onChange(`${e.target.value}${unit}`)}
            style={{ width: '100%', accentColor: '#6366F1' }} />
    </div>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 8, border: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
        <button onClick={() => onChange(!value)}
            style={{ width: 36, height: 20, borderRadius: 10, background: value ? '#6366F1' : '#D1D5DB', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 4, left: value ? 17 : 3, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
        </button>
    </div>
);

const SegmentedButton = ({ options, value, onChange }: { options: { id: string; label: string; icon?: React.ReactNode }[]; value: string; onChange: (v: string) => void }) => (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {options.map(o => (
            <button key={o.id} onClick={() => onChange(o.id)}
                style={{
                    flex: 1, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    background: value === o.id ? 'rgba(99,102,241,0.08)' : '#F9FAFB',
                    border: `1px solid ${value === o.id ? '#6366F1' : '#E5E7EB'}`,
                    borderRadius: 6, cursor: 'pointer',
                    color: value === o.id ? '#6366F1' : '#6B7280',
                    fontSize: 10, fontWeight: 700,
                }}>
                {o.icon}
                {o.label}
            </button>
        ))}
    </div>
);

const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid #E5E7EB', flexShrink: 0 }}>
            <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
                style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', border: 'none', cursor: 'pointer', padding: 0 }} />
        </div>
        <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
    </div>
);

const TextInput = ({ label, value, onChange, onBlur }: any) => (
    <div style={{ marginBottom: 12 }}>
        <Label>{label}</Label>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur}
            style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', color: '#111827', fontSize: 13, outline: 'none' }} />
    </div>
);

// ─── HeroModule ───────────────────────────────────────────────────────────────
export const HeroModule: React.FC = () => {
    const { selectedNodeId, nodes, updateNode, commitHistory } = useOmnora();
    const node = selectedNodeId ? nodes[selectedNodeId] : null;

    if (!node || !['hero', 'hero_split'].includes(node.type)) return null;

    const p = node.props || {};
    const set = (key: string, value: any) => updateNode?.(node.id, `props.${key}`, value);

    return (
        <div style={{ padding: '16px 20px' }}>
            {/* Layout */}
            <SectionLabel icon={<Columns size={12} />}>Layout</SectionLabel>
            <SegmentedButton
                options={[
                    { id: 'background', label: 'Full BG', icon: <Maximize2 size={14} /> },
                    { id: 'left', label: 'Text Left', icon: <SplitSquareHorizontal size={14} /> },
                    { id: 'right', label: 'Text Right', icon: <SplitSquareHorizontal size={14} style={{ transform: 'scaleX(-1)' }} /> },
                ]}
                value={p.layout || 'background'}
                onChange={v => set('layout', v)}
            />

            {/* Text Alignment */}
            <Label>Text Alignment</Label>
            <SegmentedButton
                options={[
                    { id: 'left', label: 'Left', icon: <AlignLeft size={14} /> },
                    { id: 'center', label: 'Center', icon: <AlignCenter size={14} /> },
                    { id: 'right', label: 'Right', icon: <AlignRight size={14} /> },
                ]}
                value={p.textAlign || 'center'}
                onChange={v => set('textAlign', v)}
            />

            {/* Vertical Alignment */}
            <Label>Vertical Alignment</Label>
            <SegmentedButton
                options={[
                    { id: 'top', label: 'Top', icon: <AlignVerticalJustifyStart size={14} /> },
                    { id: 'center', label: 'Center', icon: <AlignVerticalJustifyCenter size={14} /> },
                    { id: 'bottom', label: 'Bottom', icon: <AlignVerticalJustifyEnd size={14} /> },
                ]}
                value={p.vAlign || 'center'}
                onChange={v => set('vAlign', v)}
            />

            {/* Height */}
            <Slider label="Section Height" value={parseInt(p.height) || 500} min={200} max={900} unit="px"
                onChange={(v: string) => { set('height', v); commitHistory?.(); }} />

            {/* Content Width */}
            <Slider label="Content Width" value={parseInt(p.contentWidth) || 700} min={300} max={1200} unit="px"
                onChange={(v: string) => { set('contentWidth', v); commitHistory?.(); }} />

            {/* Background Image */}
            <div style={{ marginTop: 8 }}>
                <SectionLabel icon={<ImageIcon size={12} />}>Background</SectionLabel>
                <TextInput label="Image URL" value={p.backgroundImage} onChange={(v: string) => set('backgroundImage', v)} onBlur={commitHistory} />
                <Slider label="Overlay Opacity" value={Math.round((parseFloat(p.overlayOpacity) || 0.5) * 100)} min={0} max={100} unit="%"
                    onChange={(v: string) => { set('overlayOpacity', String(parseInt(v) / 100)); commitHistory?.(); }} />
                <ColorInput label="Overlay Color" value={p.overlayColor || '#000000'} onChange={(v) => set('overlayColor', v)} />
                <Toggle label="Blur Background" value={!!p.blurBg} onChange={v => set('blurBg', v)} />
                <Toggle label="Gradient Overlay" value={!!p.gradientOverlay} onChange={v => set('gradientOverlay', v)} />
            </div>

            {/* CTA Button */}
            <div style={{ marginTop: 8 }}>
                <SectionLabel icon={<MousePointer2 size={12} />}>CTA Button</SectionLabel>
                <TextInput label="Button Text" value={p.ctaText} onChange={(v: string) => set('ctaText', v)} onBlur={commitHistory} />
                <TextInput label="Button Link" value={p.ctaLink} onChange={(v: string) => set('ctaLink', v)} onBlur={commitHistory} />

                <Label>Button Style</Label>
                <SegmentedButton
                    options={[
                        { id: 'filled', label: 'Filled' },
                        { id: 'outline', label: 'Outline' },
                        { id: 'ghost', label: 'Ghost' },
                    ]}
                    value={p.ctaStyle || 'filled'}
                    onChange={v => set('ctaStyle', v)}
                />

                <Label>Button Size</Label>
                <SegmentedButton
                    options={[
                        { id: 'sm', label: 'S' },
                        { id: 'md', label: 'M' },
                        { id: 'lg', label: 'L' },
                        { id: 'xl', label: 'XL' },
                    ]}
                    value={p.ctaSize || 'md'}
                    onChange={v => set('ctaSize', v)}
                />

                <Slider label="Button Radius" value={parseInt(p.ctaRadius) || 4} min={0} max={50} unit="px"
                    onChange={(v: string) => { set('ctaRadius', v); commitHistory?.(); }} />
                <Toggle label="Full Width" value={!!p.ctaFullWidth} onChange={v => set('ctaFullWidth', v)} />
            </div>

            {/* Headline */}
            <div style={{ marginTop: 8 }}>
                <SectionLabel icon={<AlignLeft size={12} />}>Content</SectionLabel>
                <TextInput label="Headline" value={p.headline} onChange={(v: string) => set('headline', v)} onBlur={commitHistory} />
                <TextInput label="Subheadline" value={p.subheadline} onChange={(v: string) => set('subheadline', v)} onBlur={commitHistory} />
            </div>
        </div>
    );
};
