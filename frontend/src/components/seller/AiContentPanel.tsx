import React, { useState } from 'react';
import apiClient from '../../api/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
    { id: 'hero-headline', label: 'Hero Headline', icon: '✨', desc: 'Main banner headline for homepage' },
    { id: 'product-description', label: 'Product Description', icon: '🏷️', desc: 'Compelling product copy' },
    { id: 'about-us', label: 'About Us', icon: '🏪', desc: 'Brand story section' },
    { id: 'promo-banner', label: 'Promo Banner', icon: '📣', desc: 'Sale / promotional text' },
];

const LANGUAGES = [
    { id: 'english', label: 'English', flag: '🇬🇧' },
    { id: 'urdu', label: 'اردو', flag: '🇵🇰' },
    { id: 'roman-urdu', label: 'Roman Urdu', flag: '🇵🇰' },
];

const LENGTHS = ['short', 'medium', 'full'] as const;
const TONES = ['professional', 'friendly', 'luxury', 'bold', 'casual'] as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
    wrap: { padding: '24px', maxWidth: 780, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, minHeight: 480 } as React.CSSProperties,
    sidebar: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
    typeBtn: (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${active ? 'rgba(124,109,250,0.35)' : 'rgba(255,255,255,0.06)'}`, background: active ? 'rgba(124,109,250,0.12)' : '#111318', cursor: 'pointer', textAlign: 'left' }),
    rightPanel: { background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24 } as React.CSSProperties,
    label: { fontSize: 11, color: '#9AA4B2', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8, display: 'block' },
    optRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 20 },
    chip: (active: boolean): React.CSSProperties => ({ padding: '6px 14px', borderRadius: 6, border: `1px solid ${active ? '#7c6dfa' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(124,109,250,0.15)' : 'transparent', color: active ? '#a78bfa' : '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
    input: { width: '100%', background: '#161A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', color: '#E8ECF1', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 16 } as React.CSSProperties,
    genBtn: { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#7c6dfa,#5b47fa)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 16 } as React.CSSProperties,
    result: { background: '#161A22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 18px', fontSize: 14, color: '#E8ECF1', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, minHeight: 80 } as React.CSSProperties,
    copyBtn: { padding: '7px 16px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 6, color: '#4ade80', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginRight: 8 } as React.CSSProperties,
    regenBtn: { padding: '7px 16px', background: 'rgba(124,109,250,0.1)', border: '1px solid rgba(124,109,250,0.2)', borderRadius: 6, color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
};

// ─── Main component ───────────────────────────────────────────────────────────

const AiContentPanel: React.FC = () => {
    const [selectedType, setSelectedType] = useState('hero-headline');
    const [language, setLanguage] = useState('english');
    const [length, setLength] = useState<typeof LENGTHS[number]>('medium');
    const [tone, setTone] = useState<typeof TONES[number]>('professional');
    const [niche, setNiche] = useState('fashion');
    const [storeName, setStoreName] = useState('');
    const [extra, setExtra] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const generate = async (force = false) => {
        setLoading(true); setError(''); setResult('');
        try {
            const res = await apiClient.post('/ai/generate', { type: selectedType, niche, tone, language, length, storeName, extraContext: extra, forceRegenerate: force });
            if (res.data.status === 'done' && res.data.result) {
                setResult(res.data.result);
            } else if (res.data.status === 'pending') {
                setResult('⏳ Generating... please check back in a few seconds.');
                // Poll once after 4s
                setTimeout(() => pollResult(), 4000);
            }
        } catch (e: any) { setError(e?.response?.data?.error || 'Generation failed'); }
        setLoading(false);
    };

    const pollResult = async () => {
        try {
            const res = await apiClient.get(`/ai/content/${selectedType}`);
            if (res.data?.status === 'done') setResult(res.data.result);
            else if (res.data?.status === 'failed') setResult('❌ Generation failed. Try again.');
        } catch { }
    };

    const copy = () => {
        navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    };

    return (
        <div style={S.wrap}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8ECF1', marginBottom: 6 }}>AI Content Generator</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Generate professional store copy in English, اردو, or Roman Urdu — powered by AI.</p>

            <div style={S.grid}>
                {/* Left: content type selector */}
                <div style={S.sidebar}>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>CONTENT TYPE</div>
                    {CONTENT_TYPES.map(t => (
                        <button key={t.id} style={S.typeBtn(selectedType === t.id)} onClick={() => setSelectedType(t.id)}>
                            <span style={{ fontSize: 20 }}>{t.icon}</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: selectedType === t.id ? '#a78bfa' : '#E8ECF1' }}>{t.label}</div>
                                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 1 }}>{t.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Right: options + generate */}
                <div style={S.rightPanel}>
                    {/* Language */}
                    <label style={S.label}>Language</label>
                    <div style={S.optRow}>
                        {LANGUAGES.map(l => <button key={l.id} style={S.chip(language === l.id)} onClick={() => setLanguage(l.id)}>{l.flag} {l.label}</button>)}
                    </div>

                    {/* Length */}
                    <label style={S.label}>Length</label>
                    <div style={S.optRow}>
                        {LENGTHS.map(l => <button key={l} style={S.chip(length === l)} onClick={() => setLength(l)}>{l.charAt(0).toUpperCase() + l.slice(1)}</button>)}
                    </div>

                    {/* Tone */}
                    <label style={S.label}>Tone</label>
                    <div style={S.optRow}>
                        {TONES.map(t => <button key={t} style={S.chip(tone === t)} onClick={() => setTone(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
                    </div>

                    {/* Context fields */}
                    <label style={S.label}>Niche / Category</label>
                    <input style={S.input} placeholder="e.g. fashion, electronics, grocery..." value={niche} onChange={e => setNiche(e.target.value)} />

                    <label style={S.label}>Store Name (optional)</label>
                    <input style={S.input} placeholder="e.g. Fatima's Boutique" value={storeName} onChange={e => setStoreName(e.target.value)} />

                    <label style={S.label}>Extra Context (optional)</label>
                    <input style={S.input} placeholder="e.g. Summer sale, free delivery this week..." value={extra} onChange={e => setExtra(e.target.value)} />

                    {/* Generate button */}
                    <button style={{ ...S.genBtn, opacity: loading ? 0.7 : 1 }} onClick={() => generate(false)} disabled={loading}>
                        {loading ? '⏳ Generating…' : '✨ Generate Content'}
                    </button>

                    {/* Error */}
                    {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{error}</div>}

                    {/* Result */}
                    {result && (
                        <>
                            <div style={S.label}>RESULT</div>
                            <div style={S.result}>{result}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button style={S.copyBtn} onClick={copy}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                                <button style={S.regenBtn} onClick={() => generate(true)}>↺ Regenerate</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiContentPanel;
