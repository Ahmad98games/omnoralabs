import React, { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, ArrowRight, Shield } from 'lucide-react';

export const DomainManager: React.FC = () => {
    const [step, setStep] = useState(1);
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [dnsStatus, setDnsStatus] = useState<any>(null);

    const checkStatus = async () => {
        if (!domain) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/dns-check?domain=${encodeURIComponent(domain)}`);
            const data = await res.json();
            if (data.success) {
                setDnsStatus(data);
                if (data.propagation === 'Verified') setStep(3);
                else setStep(2);
            }
        } catch (err) {
            console.error("DNS verification failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            background: '#0e0e12',
            border: '1px solid #1a1a24',
            borderRadius: '12px',
            padding: '24px',
            color: '#fff',
            maxWidth: '600px',
            margin: '20px auto',
        }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#7c6dfa" /> Multi-Tenant Domain Engine
            </h2>
            <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '24px' }}>
                Connect your custom domain seamlessly using Omnora's Edge routing framework.
            </p>

            {/* Steps Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '14px', left: '10%', right: '10%', height: '2px', background: '#1a1a24', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: '14px', left: '10%', width: step === 1 ? '0%' : step === 2 ? '40%' : '80%', height: '2px', background: '#7c6dfa', zIndex: 2, transition: 'width 0.3s' }} />
                
                {[1, 2, 3].map((s) => (
                    <div key={s} style={{ zIndex: 3, textAlign: 'center' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: step >= s ? '#7c6dfa' : '#14141d',
                            border: `2px solid ${step >= s ? '#7c6dfa' : '#27273a'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, margin: '0 auto 4px',
                        }}>
                            {step > s ? '✓' : s}
                        </div>
                        <span style={{ fontSize: '10px', color: step >= s ? '#fff' : '#52525b', fontWeight: 600, textTransform: 'uppercase' }}>
                            {s === 1 ? 'Input' : s === 2 ? 'Verify' : 'Live'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Step 1: Input Domain */}
            {step === 1 && (
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Custom Domain Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. yourstore.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', background: '#09090b',
                                border: '1px solid #27273a', borderRadius: '6px',
                                color: '#fff', fontSize: '14px', outline: 'none'
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => { if (domain) setStep(2); checkStatus(); }}
                        disabled={!domain}
                        style={{
                            width: '100%', padding: '12px', background: '#7c6dfa',
                            color: '#fff', border: 'none', borderRadius: '6px',
                            fontWeight: 600, cursor: domain ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        Configure Domain <ArrowRight size={16} />
                    </button>
                    
                    <div style={{ marginTop: '16px', padding: '12px', background: '#14141b', borderRadius: '6px', border: '1px solid #1a1a24' }}>
                         <p style={{ fontSize: '11px', color: '#7c6dfa', fontWeight: 600, marginBottom: '4px' }}>💡 SSL Instructions:</p>
                         <p style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: 1.5 }}>
                              Omnora handles Wildcard SSLs and On-Demand TLS automatically using internal proxy rewriters edge meshes setups correctly flawlessly.
                         </p>
                    </div>
                </div>
            )}

            {/* Step 2: Display DNS table */}
            {step === 2 && (
                <div>
                    <h4 style={{ fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>Configure DNS Records</h4>
                    <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '16px' }}>Add these records on your registrar (GoDaddy, Cloudflare, etc.) to point here:</p>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: '#09090b', border: '1px solid #27273a', marginBottom: '16px' }}>
                        <thead>
                            <tr style={{ background: '#14141b' }}>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #27273a' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #27273a' }}>Host</th>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #27273a' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px', borderBottom: '1px solid #1a1a24' }}>CNAME</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #1a1a24' }}>@ / www</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #1a1a24' }}>domains.omnora.com</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#14141b', borderRadius: '6px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} /> Propagation: {dnsStatus?.propagation || 'Mismatched'}
                        </span>
                        <button 
                            onClick={checkStatus} 
                            disabled={loading}
                            style={{ background: 'transparent', border: 'none', color: '#7c6dfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Checking...' : 'Check Again'}
                        </button>
                    </div>

                    <button onClick={() => setStep(1)} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #27273a', color: '#a1a1aa', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Back to Input</button>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Domain Verified & Live!</h3>
                    <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '24px' }}>
                        Your storefront is now listening correctly mapping hosts triggers.
                    </p>
                    <a 
                        href={`https://${domain}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                            display: 'inline-block', padding: '12px 24px', background: '#10b981',
                            color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '13px'
                        }}
                    >
                        Visit Storefront
                    </a>
                </div>
            )}
        </div>
    );
};
