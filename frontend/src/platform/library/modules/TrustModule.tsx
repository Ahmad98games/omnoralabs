import React from 'react';
import { useBuilder } from '../../../context/BuilderContext';
import {
    ShieldCheck, Lock, Truck, RefreshCcw, Mail, Award,
    AlignLeft, AlignCenter, Maximize2, LayoutGrid, Rows
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
            onChange={e => onChange(`${e.target.value}${unit}`)} style={{ width: '100%', accentColor: '#6366F1' }} />
    </div>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 6, border: '1px solid #E5E7EB' }}>
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

const TextInput = ({ label, value, onChange, onBlur }: any) => (
    <div style={{ marginBottom: 12 }}>
        <Label>{label}</Label>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur}
            style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', color: '#111827', fontSize: 13, outline: 'none' }} />
    </div>
);

// ─── Trust Module ─────────────────────────────────────────────────────────────
export const TrustModule: React.FC = () => {
    const { selectedNodeId, nodeTree, updateNode, commitHistory } = useBuilder();
    const node = selectedNodeId ? nodeTree[selectedNodeId] : null;

    if (!node || !['trust_badges', 'trust_section', 'policy_block'].includes(node.type)) return null;

    const p = node.props || {};
    const set = (key: string, value: any) => updateNode(node.id, `props.${key}`, value);

    const BADGES = [
        { icon: <Lock size={14} />, label: 'Secure', key: 'badgeSecure' },
        { icon: <Truck size={14} />, label: 'Shipping', key: 'badgeShipping' },
        { icon: <RefreshCcw size={14} />, label: 'Returns', key: 'badgeReturns' },
        { icon: <Award size={14} />, label: 'Quality', key: 'badgeQuality' },
        { icon: <ShieldCheck size={14} />, label: 'Warranty', key: 'badgeWarranty' },
        { icon: <Mail size={14} />, label: 'Support', key: 'badgeSupport' },
    ];

    return (
        <div style={{ padding: '16px 20px' }}>
            {/* Badge Selection */}
            <SectionLabel icon={<ShieldCheck size={12} />}>Badge Library</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
                {BADGES.map(badge => (
                    <button key={badge.key}
                        onClick={() => set(badge.key, !p[badge.key])}
                        style={{
                            padding: '10px 4px',
                            background: p[badge.key] ? 'rgba(99,102,241,0.08)' : '#F9FAFB',
                            border: `1px solid ${p[badge.key] ? '#6366F1' : '#E5E7EB'}`,
                            color: p[badge.key] ? '#6366F1' : '#6B7280',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 700,
                        }}>
                        {badge.icon}
                        {badge.label.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Layout */}
            <SectionLabel icon={<LayoutGrid size={12} />}>Layout</SectionLabel>
            <Label>Badge Layout</Label>
            <SegmentedButton
                options={[
                    { id: 'row', label: 'Row', icon: <Rows size={14} /> },
                    { id: 'grid', label: 'Grid', icon: <LayoutGrid size={14} /> },
                ]}
                value={p.badgeLayout || 'row'}
                onChange={v => set('badgeLayout', v)}
            />

            <Label>Alignment</Label>
            <SegmentedButton
                options={[
                    { id: 'left', label: 'Left', icon: <AlignLeft size={14} /> },
                    { id: 'center', label: 'Center', icon: <AlignCenter size={14} /> },
                ]}
                value={p.badgeAlign || 'center'}
                onChange={v => set('badgeAlign', v)}
            />

            <Slider label="Icon Size" value={parseInt(p.iconSize) || 28} min={16} max={48} unit="px"
                onChange={(v: string) => { set('iconSize', v); commitHistory(); }} />

            <Slider label="Badge Spacing" value={parseInt(p.badgeSpacing) || 20} min={0} max={60} unit="px"
                onChange={(v: string) => { set('badgeSpacing', v); commitHistory(); }} />

            {/* Custom Badge Text */}
            <div style={{ marginTop: 4 }}>
                <SectionLabel icon={<Award size={12} />}>Custom Text</SectionLabel>
                {BADGES.filter(b => p[b.key]).map(badge => (
                    <TextInput key={badge.key}
                        label={`${badge.label} Label`}
                        value={p[`${badge.key}Label`] || badge.label}
                        onChange={(v: string) => set(`${badge.key}Label`, v)}
                        onBlur={commitHistory} />
                ))}
            </div>

            {/* Style */}
            <Label>Badge Style</Label>
            <SegmentedButton
                options={[
                    { id: 'modern', label: 'Modern' },
                    { id: 'classic', label: 'Classic' },
                    { id: 'subtle', label: 'Subtle' },
                ]}
                value={p.verifiedBadgeStyle || 'modern'}
                onChange={v => set('verifiedBadgeStyle', v)}
            />

            {/* Popups */}
            <div style={{ marginTop: 8 }}>
                <SectionLabel icon={<Mail size={12} />}>Conversion Popups</SectionLabel>
                <Toggle label="Exit Intent Popup" value={!!p.enableExitPopup} onChange={v => set('enableExitPopup', v)} />
                {p.enableExitPopup && (
                    <TextInput label="Popup Heading"
                        value={p.newsletterHeading || 'Join our inner circle'}
                        onChange={(v: string) => set('newsletterHeading', v)}
                        onBlur={commitHistory} />
                )}
            </div>
        </div>
    );
};
