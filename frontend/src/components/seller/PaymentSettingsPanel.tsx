import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethods {
    cod: boolean;
    bankTransfer: boolean;
    easypaisa: boolean;
    jazzcash: boolean;
    stripe: boolean;
}

interface BankDetails {
    accountTitle: string;
    accountNumber: string;
    bankName: string;
    iban: string;
}

interface Config {
    methods: PaymentMethods;
    bankDetails: BankDetails;
    easypaisaNumber: string;
    jazzcashNumber: string;
    codFee: number;
    bankTransferInstructions: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
    wrap: { padding: '28px', maxWidth: 760, margin: '0 auto' } as React.CSSProperties,
    heading: { fontSize: 20, fontWeight: 700, color: '#E8ECF1', marginBottom: 6 } as React.CSSProperties,
    sub: { fontSize: 13, color: '#6B7280', marginBottom: 28 } as React.CSSProperties,
    section: { background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 20 } as React.CSSProperties,
    sectionTitle: { fontSize: 12, fontWeight: 700, color: '#9AA4B2', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 16 },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as React.CSSProperties,
    methodLabel: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
    methodName: { fontSize: 14, fontWeight: 600, color: '#E8ECF1' } as React.CSSProperties,
    methodDesc: { fontSize: 12, color: '#6B7280' } as React.CSSProperties,
    toggle: (on: boolean): React.CSSProperties => ({
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: on ? '#7c6dfa' : '#2a2a48',
        position: 'relative', transition: 'background 0.2s ease', flexShrink: 0
    }),
    toggleDot: (on: boolean): React.CSSProperties => ({
        position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease'
    }),
    label: { fontSize: 12, color: '#9AA4B2', marginBottom: 6, display: 'block' } as React.CSSProperties,
    input: { width: '100%', background: '#161A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', color: '#E8ECF1', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 14 } as React.CSSProperties,
    saveBtn: { padding: '11px 28px', background: '#7c6dfa', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%', transition: 'opacity 0.2s' } as React.CSSProperties,
    badge: (color: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 8px', background: color, borderRadius: 4, fontSize: 11, fontWeight: 700 }),
    saved: { textAlign: 'center' as const, color: '#4ade80', fontSize: 13, marginTop: 10 },
};

// ─── Toggle component ─────────────────────────────────────────────────────────

const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
    <button style={S.toggle(on)} onClick={onChange} aria-label="toggle">
        <span style={S.toggleDot(on)} />
    </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

const PaymentSettingsPanel: React.FC = () => {
    const [config, setConfig] = useState<Config>({
        methods: { cod: true, bankTransfer: false, easypaisa: false, jazzcash: false, stripe: false },
        bankDetails: { accountTitle: '', accountNumber: '', bankName: '', iban: '' },
        easypaisaNumber: '',
        jazzcashNumber: '',
        codFee: 0,
        bankTransferInstructions: 'Please transfer the amount and send a screenshot on WhatsApp.',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        apiClient.get('/payment-methods').then(r => {
            if (r.data) setConfig(c => ({ ...c, ...r.data }));
        }).catch(() => { });
    }, []);

    const setMethod = (k: keyof PaymentMethods) =>
        setConfig(c => ({ ...c, methods: { ...c.methods, [k]: !c.methods[k] } }));

    const setField = (path: string, val: any) => {
        setConfig(c => {
            const keys = path.split('.');
            const next: any = { ...c };
            let cur = next;
            for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = { ...cur[keys[i]] }; cur = cur[keys[i]]; }
            cur[keys[keys.length - 1]] = val;
            return next;
        });
    };

    const save = async () => {
        setSaving(true);
        try { await apiClient.put('/payment-methods', config); setSaved(true); setTimeout(() => setSaved(false), 3000); }
        catch (e) { console.error(e); }
        setSaving(false);
    };

    const METHODS = [
        { key: 'cod' as const, name: 'Cash on Delivery', desc: 'Most popular in Pakistan — buyer pays upon delivery', badge: '#4ade80' },
        { key: 'bankTransfer' as const, name: 'Bank Transfer', desc: 'Manual verification required after payment', badge: '#60a5fa' },
        { key: 'easypaisa' as const, name: 'Easypaisa', desc: 'Pakistan\'s leading mobile wallet', badge: '#34d399' },
        { key: 'jazzcash' as const, name: 'JazzCash', desc: 'Jazz mobile wallet — instant confirmation', badge: '#f97316' },
        { key: 'stripe' as const, name: 'Stripe (Card)', desc: 'International credit/debit card payments', badge: '#a78bfa' },
    ];

    return (
        <div style={S.wrap}>
            <h2 style={S.heading}>Payment Methods</h2>
            <p style={S.sub}>Enable the methods your customers can use at checkout</p>

            {/* Method toggles */}
            <div style={S.section}>
                <div style={S.sectionTitle}>Active Methods</div>
                {METHODS.map(m => (
                    <div key={m.key} style={S.row}>
                        <div style={S.methodLabel}>
                            <span style={S.methodName}>{m.name} <span style={S.badge(m.badge + '22')}>{m.badge === '#4ade80' ? '✓ RECOMMENDED' : ''}</span></span>
                            <span style={S.methodDesc}>{m.desc}</span>
                        </div>
                        <Toggle on={config.methods[m.key]} onChange={() => setMethod(m.key)} />
                    </div>
                ))}
            </div>

            {/* COD settings */}
            {config.methods.cod && (
                <div style={S.section}>
                    <div style={S.sectionTitle}>COD Settings</div>
                    <label style={S.label}>Extra COD fee (PKR) — leave 0 for free</label>
                    <input style={S.input} type="number" min={0} value={config.codFee}
                        onChange={e => setField('codFee', Number(e.target.value))} />
                </div>
            )}

            {/* Bank transfer */}
            {config.methods.bankTransfer && (
                <div style={S.section}>
                    <div style={S.sectionTitle}>Bank Account Details</div>
                    {(['accountTitle', 'accountNumber', 'bankName', 'iban'] as const).map(f => (
                        <div key={f}>
                            <label style={S.label}>{f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                            <input style={S.input} value={(config.bankDetails as any)[f]}
                                onChange={e => setField(`bankDetails.${f}`, e.target.value)} />
                        </div>
                    ))}
                    <label style={S.label}>Instructions shown to customer</label>
                    <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' as const }}
                        value={config.bankTransferInstructions}
                        onChange={e => setField('bankTransferInstructions', e.target.value)} />
                </div>
            )}

            {/* Easypaisa */}
            {config.methods.easypaisa && (
                <div style={S.section}>
                    <div style={S.sectionTitle}>Easypaisa Number</div>
                    <input style={S.input} placeholder="03XX-XXXXXXX" value={config.easypaisaNumber}
                        onChange={e => setField('easypaisaNumber', e.target.value)} />
                </div>
            )}

            {/* JazzCash */}
            {config.methods.jazzcash && (
                <div style={S.section}>
                    <div style={S.sectionTitle}>JazzCash Number</div>
                    <input style={S.input} placeholder="03XX-XXXXXXX" value={config.jazzcashNumber}
                        onChange={e => setField('jazzcashNumber', e.target.value)} />
                </div>
            )}

            <button style={S.saveBtn} onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Payment Settings'}
            </button>
            {saved && <p style={S.saved}>✓ Saved successfully</p>}
        </div>
    );
};

export default PaymentSettingsPanel;
