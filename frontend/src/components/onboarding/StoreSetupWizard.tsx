import React, { useState } from 'react';
import apiClient from '../../api/client';
import { LogoPicker } from '../media/LogoPicker';
import { MediaStoreProvider } from '../../context/MediaStoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'store' | 'branding' | 'payments' | 'launch';

const STEPS: { id: Step; label: string; icon: string }[] = [
    { id: 'store', label: 'Store Info', icon: '🏪' },
    { id: 'branding', label: 'Branding', icon: '🎨' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'launch', label: 'Launch', icon: '🚀' },
];

const NICHES = [
    { id: 'fashion', label: 'Fashion & Clothing', icon: '👗' },
    { id: 'electronics', label: 'Electronics', icon: '📱' },
    { id: 'general', label: 'General Store', icon: '🛒' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
    modal: { background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' as const, boxShadow: '0 40px 100px rgba(0,0,0,0.7)' },
    header: { padding: '32px 36px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    stepBar: { display: 'flex', gap: 0, padding: '0 36px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    stepTab: (active: boolean, done: boolean): React.CSSProperties => ({ flex: 1, padding: '14px 8px', textAlign: 'center' as const, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: done ? '#4ade80' : active ? '#a78bfa' : '#4B5563', transition: 'all 0.2s', background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#7c6dfa' : done ? '#4ade8044' : 'transparent'}` }),
    body: { padding: '28px 36px' },
    label: { display: 'block', fontSize: 12, color: '#9AA4B2', marginBottom: 6, fontWeight: 600 } as React.CSSProperties,
    input: { width: '100%', background: '#161A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', color: '#E8ECF1', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 18 } as React.CSSProperties,
    nicheCard: (selected: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 12, border: `2px solid ${selected ? '#7c6dfa' : 'rgba(255,255,255,0.07)'}`, background: selected ? 'rgba(124,109,250,0.1)' : '#161A22', cursor: 'pointer', marginBottom: 10, transition: 'all 0.15s' }),
    toggle: (on: boolean): React.CSSProperties => ({ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? '#7c6dfa' : '#2a2a48', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }),
    dot: (on: boolean): React.CSSProperties => ({ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }),
    footer: { display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', padding: '20px 36px', borderTop: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
    btnPrimary: { padding: '12px 28px', background: 'linear-gradient(135deg,#7c6dfa,#5b47fa)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' } as React.CSSProperties,
    btnGhost: { padding: '12px 20px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#6B7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' } as React.CSSProperties,
    check: { width: 20, height: 20, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 } as React.CSSProperties,
};

// ─── Step panels ──────────────────────────────────────────────────────────────

const StoreStep: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => (
    <div>
        <label style={S.label}>Store Name *</label>
        <input style={S.input} placeholder="e.g. Fatima's Boutique" value={data.storeName || ''}
            onChange={e => onChange({ ...data, storeName: e.target.value })} />
        <label style={S.label}>Store Niche</label>
        {NICHES.map(n => (
            <div key={n.id} style={S.nicheCard(data.niche === n.id)} onClick={() => onChange({ ...data, niche: n.id })}>
                <span style={{ fontSize: 28 }}>{n.icon}</span>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#E8ECF1' }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Pre-built layout included</div>
                </div>
                {data.niche === n.id && <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>}
            </div>
        ))}
    </div>
);

const BrandingStep: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => (
    <div>
        <LogoPicker
            value={data.logoUrl}
            onChange={(url) => onChange({ ...data, logoUrl: url })}
            label="Brand Logo"
        />
        <label style={S.label}>Brand Slogan</label>
        <input style={S.input} placeholder="e.g. Elevate your style" value={data.slogan || ''} onChange={e => onChange({ ...data, slogan: e.target.value })} />
        <label style={S.label}>Primary Color</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
            <input type="color" value={data.primaryColor || '#0e0e1a'} onChange={e => onChange({ ...data, primaryColor: e.target.value })} style={{ width: 44, height: 44, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 0 }} />
            <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={data.primaryColor || '#0e0e1a'} onChange={e => onChange({ ...data, primaryColor: e.target.value })} />
        </div>
        <label style={S.label}>Accent Color</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
            <input type="color" value={data.accentColor || '#C5A059'} onChange={e => onChange({ ...data, accentColor: e.target.value })} style={{ width: 44, height: 44, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 0 }} />
            <input style={{ ...S.input, flex: 1, marginBottom: 0 }} value={data.accentColor || '#C5A059'} onChange={e => onChange({ ...data, accentColor: e.target.value })} />
        </div>
    </div>
);

const PaymentsStep: React.FC<{ data: any; onChange: (d: any) => void }> = ({ data, onChange }) => {
    const toggle = (k: string) => onChange({ ...data, [k]: !data[k] });
    const methods = [
        { key: 'cod', label: 'Cash on Delivery', desc: 'Recommended — most popular in Pakistan', icon: '💵' },
        { key: 'easypaisa', label: 'Easypaisa', desc: 'Mobile wallet payments', icon: '📲' },
        { key: 'jazzcash', label: 'JazzCash', desc: 'Jazz mobile wallet', icon: '📱' },
        { key: 'bankTransfer', label: 'Bank Transfer', desc: 'Manual verification', icon: '🏦' },
    ];
    return (
        <div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>You can change these any time from Settings → Payments.</p>
            {methods.map(m => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#161A22', borderRadius: 10, marginBottom: 10, border: `1px solid ${data[m.key] ? 'rgba(124,109,250,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 24 }}>{m.icon}</span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#E8ECF1' }}>{m.label}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{m.desc}</div>
                        </div>
                    </div>
                    <button style={S.toggle(data[m.key])} onClick={() => toggle(m.key)}>
                        <span style={S.dot(data[m.key])} />
                    </button>
                </div>
            ))}
        </div>
    );
};

const LaunchStep: React.FC<{ storeData: any; launching: boolean }> = ({ storeData, launching }) => (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {launching ? (
            <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#E8ECF1', marginBottom: 8 }}>Setting up your store…</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>Applying template, seeding products, enabling payments</div>
            </div>
        ) : (
            <div>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🚀</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#E8ECF1', marginBottom: 10 }}>Ready to Launch!</div>
                <div style={{ fontSize: 13, color: '#9AA4B2', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>
                    Your store <strong style={{ color: '#a78bfa' }}>{storeData.storeName}</strong> will be set up with a <strong style={{ color: '#a78bfa' }}>{storeData.niche || 'general'}</strong> layout, 3 demo products, and your payment methods ready.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', background: '#111318', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Layout template applied', '3 demo products seeded', 'Payment methods configured', 'COD enabled by default'].map(item => (
                        <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#D1D5DB' }}>
                            <span style={{ color: '#4ade80', fontWeight: 800 }}>✓</span> {item}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// ─── Main wizard ──────────────────────────────────────────────────────────────

interface Props { onComplete?: () => void; onClose?: () => void; }

const StoreSetupWizard: React.FC<Props> = ({ onComplete, onClose }) => {
    const stepIds: Step[] = ['store', 'branding', 'payments', 'launch'];
    const [currentIdx, setCurrentIdx] = useState(0);
    const [done, setDone] = useState<Set<number>>(new Set());
    const [launching, setLaunching] = useState(false);
    const [error, setError] = useState('');

    const [storeData, setStoreData] = useState({ storeName: '', niche: 'fashion' });
    const [brandData, setBrandData] = useState({ logoUrl: '', slogan: '', primaryColor: '#0e0e1a', accentColor: '#C5A059' });
    const [paymentData, setPaymentData] = useState({ cod: true, easypaisa: false, jazzcash: false, bankTransfer: false });

    const currentStep = stepIds[currentIdx];

    const canAdvance = () => {
        if (currentStep === 'store') return !!storeData.storeName.trim();
        return true;
    };

    const advance = async () => {
        if (!canAdvance()) { setError('Please fill in required fields'); return; }
        setError('');

        try {
            if (currentStep === 'store') await apiClient.post('/onboarding/store', storeData);
            if (currentStep === 'branding') await apiClient.post('/onboarding/branding', brandData);
            if (currentStep === 'payments') await apiClient.post('/onboarding/payments', paymentData);

            if (currentStep === 'launch') {
                setLaunching(true);
                const response = await apiClient.post('/onboarding/launch', { 
                    niche: storeData.niche, 
                    storeName: storeData.storeName 
                });
                
                if (response.status === 202) {
                    const jobId = response.data.jobId;
                    // Manual poll for simpler onboarding UI
                    const poll = setInterval(async () => {
                        try {
                            const res = await apiClient.get(`/jobs/${jobId}`);
                            if (res.data.status === 'completed') {
                                clearInterval(poll);
                                setLaunching(false);
                                onComplete?.();
                            } else if (res.data.status === 'failed') {
                                clearInterval(poll);
                                setError('Launch failed: ' + res.data.error);
                                setLaunching(false);
                            }
                        } catch (e) {
                            clearInterval(poll);
                            setLaunching(false);
                        }
                    }, 2000);
                    return;
                }
                
                setLaunching(false);
                onComplete?.();
                return;
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Something went wrong');
            setLaunching(false);
            return;
        }

        setDone(d => new Set(d).add(currentIdx));
        setCurrentIdx(i => i + 1);
    };

    return (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose?.()}>
            <div style={S.modal}>
                {/* Header */}
                <div style={S.header}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8ECF1', margin: 0 }}>Set Up Your Store</h2>
                            <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>Takes about 2 minutes</p>
                        </div>
                        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>}
                    </div>
                </div>

                {/* Step tabs */}
                <div style={S.stepBar}>
                    {STEPS.map((s, i) => (
                        <button key={s.id} style={S.stepTab(i === currentIdx, done.has(i))} onClick={() => { if (done.has(i) || i <= currentIdx) setCurrentIdx(i); }}>
                            <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>{done.has(i) ? '✓' : s.icon}</span>
                            <span style={{ display: 'block' }}>{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={S.body}>
                    {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>}

                    {currentStep === 'store' && <StoreStep data={storeData} onChange={setStoreData} />}
                    {currentStep === 'branding' && <BrandingStep data={brandData} onChange={setBrandData} />}
                    {currentStep === 'payments' && <PaymentsStep data={paymentData} onChange={setPaymentData} />}
                    {currentStep === 'launch' && <LaunchStep storeData={storeData} launching={launching} />}
                </div>

                {/* Footer */}
                <div style={S.footer}>
                    {currentIdx > 0 && currentStep !== 'launch' && (
                        <button style={S.btnGhost} onClick={() => setCurrentIdx(i => i - 1)}>← Back</button>
                    )}
                    <button style={S.btnPrimary} onClick={advance} disabled={launching}>
                        {currentStep === 'launch' ? (launching ? 'Launching…' : '🚀 Launch Store') : 'Continue →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StoreSetupWizardWrapper: React.FC<Props> = (props) => (
    <MediaStoreProvider>
        <StoreSetupWizard {...props} />
    </MediaStoreProvider>
);

export default StoreSetupWizardWrapper;
