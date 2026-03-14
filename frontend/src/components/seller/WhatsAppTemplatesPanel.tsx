import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

const EVENTS = [
    { id: 'order.created', label: 'Order Confirmed', icon: '🧾', desc: 'Sent immediately when order is placed' },
    { id: 'order.shipped', label: 'Order Shipped', icon: '📦', desc: 'Sent when you mark order as shipped' },
    { id: 'order.delivered', label: 'Order Delivered', icon: '✅', desc: 'Sent when order is delivered' },
    { id: 'cart.abandoned', label: 'Abandoned Cart', icon: '🛒', desc: 'Sent 60 min after cart inactivity' },
    { id: 'customer.reorder', label: 'Reorder Reminder', icon: '💛', desc: 'Sent 7 days after delivery' },
];

const CHIP_VARS = ['{{name}}', '{{orderId}}', '{{total}}', '{{trackingNumber}}', '{{storeName}}', '{{cartLink}}', '{{storeLink}}'];

interface Template { eventName: string; templateText: string; isActive: boolean; timingWindowStart: number; timingWindowEnd: number; minGapHours: number; }

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
    wrap: { padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 760, margin: '0 auto' } as React.CSSProperties,
    card: { background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 16 } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, cursor: 'pointer' } as React.CSSProperties,
    label: { fontSize: 12, color: '#9AA4B2', marginBottom: 6, display: 'block', fontWeight: 600 } as React.CSSProperties,
    textarea: { width: '100%', background: '#161A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', color: '#E8ECF1', fontSize: 13, resize: 'vertical' as const, minHeight: 90, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, lineHeight: 1.5 } as React.CSSProperties,
    toggle: (on: boolean): React.CSSProperties => ({ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: on ? '#7c6dfa' : '#2a2a48', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }),
    dot: (on: boolean): React.CSSProperties => ({ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }),
    chip: { background: 'rgba(124,109,250,0.15)', border: '1px solid rgba(124,109,250,0.25)', borderRadius: 4, padding: '3px 8px', fontSize: 11, color: '#a78bfa', cursor: 'pointer', fontFamily: 'monospace', display: 'inline-block', marginRight: 4, marginBottom: 4 } as React.CSSProperties,
    numInput: { width: 70, background: '#161A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 10px', color: '#E8ECF1', fontSize: 13, outline: 'none', textAlign: 'center' as const },
    saveBtn: { padding: '8px 20px', background: '#7c6dfa', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 16 } as React.CSSProperties,
};

// ─── Single template card ─────────────────────────────────────────────────────

const TemplateCard: React.FC<{ ev: typeof EVENTS[0]; template: Template | undefined; onSave: (t: Partial<Template>) => void }> = ({ ev, template, onSave }) => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState(template?.templateText || '');
    const [active, setActive] = useState(template?.isActive ?? true);
    const [winStart, setWinStart] = useState(template?.timingWindowStart ?? 9);
    const [winEnd, setWinEnd] = useState(template?.timingWindowEnd ?? 21);
    const [gap, setGap] = useState(template?.minGapHours ?? 24);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (template) { setText(template.templateText); setActive(template.isActive); setWinStart(template.timingWindowStart); setWinEnd(template.timingWindowEnd); setGap(template.minGapHours); }
    }, [template]);

    const insertVar = (v: string) => { setText(t => t + v); };

    const save = () => {
        onSave({ eventName: ev.id, templateText: text, isActive: active, timingWindowStart: winStart, timingWindowEnd: winEnd, minGapHours: gap });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div style={{ ...S.card, border: active ? '1px solid rgba(124,109,250,0.2)' : '1px solid rgba(255,255,255,0.04)' }}>
            <div style={S.header} onClick={() => setOpen(o => !o)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 22 }}>{ev.icon}</span>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#E8ECF1' : '#6B7280' }}>{ev.label}</div>
                        <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{ev.desc}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button style={S.toggle(active)} onClick={e => { e.stopPropagation(); setActive(a => !a); }}>
                        <span style={S.dot(active)} />
                    </button>
                    <span style={{ color: '#6B7280', fontSize: 16 }}>{open ? '▲' : '▼'}</span>
                </div>
            </div>

            {open && (
                <div>
                    {/* Variable chips */}
                    <label style={S.label}>Quick Insert Variables</label>
                    <div style={{ marginBottom: 12 }}>
                        {CHIP_VARS.map(v => <span key={v} style={S.chip} onClick={() => insertVar(v)}>{v}</span>)}
                    </div>

                    {/* Template text */}
                    <label style={S.label}>Message Template</label>
                    <textarea style={S.textarea} value={text} onChange={e => setText(e.target.value)} />

                    {/* Live preview */}
                    {text && (
                        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', marginTop: 10, fontSize: 12, color: '#9AA4B2', lineHeight: 1.6 }}>
                            <div style={{ fontSize: 10, color: '#4B5563', marginBottom: 6, fontWeight: 700 }}>PREVIEW</div>
                            {text.replace(/{{name}}/g, 'Ahmed').replace(/{{orderId}}/g, 'ORD12345').replace(/{{total}}/g, '2,499').replace(/{{storeName}}/g, 'My Store').replace(/{{trackingNumber}}/g, 'TCS-7890').replace(/{{cartLink}}/g, 'store.com/cart')}
                        </div>
                    )}

                    {/* Anti-spam controls */}
                    <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' as const }}>
                        <div>
                            <label style={S.label}>Send only between (hour)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="number" style={S.numInput} min={0} max={23} value={winStart} onChange={e => setWinStart(Number(e.target.value))} />
                                <span style={{ color: '#6B7280' }}>–</span>
                                <input type="number" style={S.numInput} min={0} max={23} value={winEnd} onChange={e => setWinEnd(Number(e.target.value))} />
                            </div>
                        </div>
                        <div>
                            <label style={S.label}>Min gap between same event (hours)</label>
                            <input type="number" style={S.numInput} min={1} value={gap} onChange={e => setGap(Number(e.target.value))} />
                        </div>
                    </div>

                    <button style={S.saveBtn} onClick={save}>{saved ? '✓ Saved' : 'Save Template'}</button>
                </div>
            )}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const WhatsAppTemplatesPanel: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/whatsapp-templates').then(r => { setTemplates(r.data || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleSave = async (eventName: string, data: Partial<Template>) => {
        try {
            await apiClient.put(`/whatsapp-templates/${eventName}`, data);
            setTemplates(ts => ts.map(t => t.eventName === eventName ? { ...t, ...data } : t));
        } catch (e) { console.error(e); }
    };

    if (loading) return <div style={{ padding: 40, color: '#6B7280', textAlign: 'center' }}>Loading templates…</div>;

    return (
        <div style={S.wrap}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8ECF1', marginBottom: 6 }}>WhatsApp Automation</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Auto-send messages to customers on key events. Uses your WhatsApp number.</p>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginBottom: 24 }}>
                ⚠️ Anti-spam built in: messages respect timing window, 24h gap between same event, and honour customer STOP requests automatically.
            </div>

            {EVENTS.map(ev => (
                <TemplateCard
                    key={ev.id}
                    ev={ev}
                    template={templates.find(t => t.eventName === ev.id)}
                    onSave={(data) => handleSave(ev.id, data)}
                />
            ))}
        </div>
    );
};

export default WhatsAppTemplatesPanel;
