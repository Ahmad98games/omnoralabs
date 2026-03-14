import React from 'react';
import { useOmnora } from '../../client/OmnoraContext';
import {
    Grid, Image as ImageIcon, MousePointer2, List,
    Square, RectangleHorizontal,
    RectangleVertical, Tag, ShoppingCart
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

const Slider = ({ label, value, min = 0, max = 100, unit = '', onChange }: any) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Label>{label}</Label>
            <span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{value || 0}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={parseInt(value) || 0}
            onChange={e => onChange(e.target.value)} style={{ width: '100%', accentColor: '#6366F1' }} />
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

// ─── ProductModule ────────────────────────────────────────────────────────────
export const ProductModule: React.FC = () => {
    const { selectedNodeId, nodes, updateNode, commitHistory } = useOmnora();
    const node = selectedNodeId ? nodes[selectedNodeId] : null;

    if (!node || !['product_grid', 'product_card', 'featured_product', 'best_sellers'].includes(node.type)) return null;

    const p = node.props || {};
    const set = (key: string, value: any) => updateNode?.(node.id, `props.${key}`, value);

    return (
        <div style={{ padding: '16px 20px' }}>
            {/* Grid Layout */}
            <SectionLabel icon={<Grid size={12} />}>Grid Layout</SectionLabel>

            <Slider label="Products per Row (Desktop)" value={p.columnsDesktop || 4} min={2} max={6}
                onChange={(v: string) => { set('columnsDesktop', parseInt(v)); commitHistory?.(); }} />

            <Slider label="Products per Row (Mobile)" value={p.columnsMobile || 1} min={1} max={2}
                onChange={(v: string) => { set('columnsMobile', parseInt(v)); commitHistory?.(); }} />

            <Slider label="Card Spacing" value={parseInt(p.cardSpacing) || 24} min={0} max={60} unit="px"
                onChange={(v: string) => { set('cardSpacing', v); commitHistory?.(); }} />

            {/* Card Style */}
            <Label>Card Style</Label>
            <SegmentedButton
                options={[
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'bordered', label: 'Bordered' },
                    { id: 'shadow', label: 'Shadow' },
                    { id: 'elevated', label: 'Elevated' },
                ]}
                value={p.cardStyle || 'minimal'}
                onChange={v => set('cardStyle', v)}
            />

            {/* Image Ratio */}
            <div style={{ marginTop: 4 }}>
                <SectionLabel icon={<ImageIcon size={12} />}>Product Images</SectionLabel>
                <Label>Image Ratio</Label>
                <SegmentedButton
                    options={[
                        { id: 'square', label: 'Square', icon: <Square size={14} /> },
                        { id: 'portrait', label: 'Portrait', icon: <RectangleVertical size={14} /> },
                        { id: 'landscape', label: 'Landscape', icon: <RectangleHorizontal size={14} /> },
                    ]}
                    value={p.imageRatio || 'square'}
                    onChange={v => set('imageRatio', v)}
                />

                <Label>Image Fit</Label>
                <SegmentedButton
                    options={[
                        { id: 'cover', label: 'Cover' },
                        { id: 'contain', label: 'Contain' },
                    ]}
                    value={p.imageFit || 'cover'}
                    onChange={v => set('imageFit', v)}
                />

                <Slider label="Image Border Radius" value={parseInt(p.imageRadius) || 8} min={0} max={30} unit="px"
                    onChange={(v: string) => { set('imageRadius', v); commitHistory?.(); }} />
            </div>

            {/* Hover Effect */}
            <div style={{ marginTop: 4 }}>
                <SectionLabel icon={<MousePointer2 size={12} />}>Interaction</SectionLabel>
                <Label>Hover Effect</Label>
                <SegmentedButton
                    options={[
                        { id: 'none', label: 'None' },
                        { id: 'zoom', label: 'Zoom' },
                        { id: 'second_image', label: '2nd Img' },
                        { id: 'overlay', label: 'Overlay' },
                    ]}
                    value={p.hoverEffect || 'zoom'}
                    onChange={v => set('hoverEffect', v)}
                />
            </div>

            {/* Content Toggles */}
            <div style={{ marginTop: 4 }}>
                <SectionLabel icon={<Tag size={12} />}>Product Card Content</SectionLabel>
                <Toggle label="Show Price" value={p.showPrice !== false} onChange={v => set('showPrice', v)} />
                <Toggle label="Show Discount" value={!!p.showDiscount} onChange={v => set('showDiscount', v)} />
                <Toggle label="Show Rating" value={!!p.showRating} onChange={v => set('showRating', v)} />
                <Toggle label="Show Sale Badge" value={!!p.showSaleBadge} onChange={v => set('showSaleBadge', v)} />
                <Toggle label="Add to Cart Button" value={p.showAddToCart !== false} onChange={v => set('showAddToCart', v)} />
                <Toggle label="Quick View" value={!!p.showQuickView} onChange={v => set('showQuickView', v)} />
            </div>

            {/* Text Customization */}
            <div style={{ marginTop: 4 }}>
                <SectionLabel icon={<ShoppingCart size={12} />}>Button & Text</SectionLabel>
                <TextInput label="Add to Cart Text" value={p.addToCartText || 'Add to Cart'} onChange={(v: string) => set('addToCartText', v)} onBlur={commitHistory} />
                <ColorInput label="Price Color" value={p.priceColor || '#111827'} onChange={v => set('priceColor', v)} />
                <ColorInput label="Sale Price Color" value={p.salePriceColor || '#EF4444'} onChange={v => set('salePriceColor', v)} />
            </div>

            {/* Filtering */}
            <div style={{ marginTop: 4 }}>
                <SectionLabel icon={<List size={12} />}>Discovery</SectionLabel>
                <Toggle label="Show Category Filters" value={!!p.enableFilters} onChange={v => set('enableFilters', v)} />
                <Toggle label="Quick Add Button" value={!!p.showQuickAdd} onChange={v => set('showQuickAdd', v)} />
            </div>
        </div>
    );
};
