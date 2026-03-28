import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Search, Globe, MoveRight, Plus, Trash2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export const SEOManager: React.FC = () => {
    const [redirects, setRedirects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState({ title: 'Omnora OS | Luxury Commerce', description: 'The high-performance universal commerce operating system.', slug: 'home' });

    useEffect(() => {
        fetchRedirects();
    }, []);

    const fetchRedirects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('url_redirects')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setRedirects(data || []);
        setLoading(false);
    };

    const InputStyle = { 
        width: '100%', padding: '10px 12px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 8, color: '#fff', fontSize: '13px', outline: 'none' 
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>SEO & Search</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Control how your store appears in search engines</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, marginBottom: 48 }}>
                {/* Left: SEO Editor */}
                <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, padding: 32 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Homepage SEO</h2>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 11, color: '#71717a', fontWeight: 700 }}>PAGE TITLE</label>
                            <span style={{ fontSize: 10, color: preview.title.length > 60 ? '#ef4444' : '#22c55e' }}>{preview.title.length}/60</span>
                        </div>
                        <input value={preview.title} onChange={e => setPreview({...preview, title: e.target.value})} style={InputStyle} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 11, color: '#71717a', fontWeight: 700 }}>META DESCRIPTION</label>
                            <span style={{ fontSize: 10, color: preview.description.length > 160 ? '#ef4444' : '#22c55e' }}>{preview.description.length}/160</span>
                        </div>
                        <textarea rows={3} value={preview.description} onChange={e => setPreview({...preview, description: e.target.value})} style={{...InputStyle, resize: 'none'}} />
                    </div>
                    <button style={{ padding: '10px 24px', background: '#FF6B35', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Update SEO</button>
                </div>

                {/* Right: Google Preview */}
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, height: 'fit-content' }}>
                    <div style={{ display: 'flex', items: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ea4335' }} />
                        <span style={{ fontSize: 11, color: '#70757a', fontWeight: 500 }}>Google Search Preview</span>
                    </div>
                    <div style={{ color: '#1a0dab', fontSize: 18, marginBottom: 4, lineHeight: '1.2' }}>{preview.title}</div>
                    <div style={{ color: '#006621', fontSize: 13, marginBottom: 4 }}>https://omnora.com › {preview.slug}</div>
                    <div style={{ color: '#4d5156', fontSize: 13, lineHeight: '1.4' }}>{preview.description}</div>
                </div>
            </div>

            {/* 301 Redirects */}
            <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: 24, borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>301 Redirects</h2>
                    <button style={{ padding: '6px 12px', background: 'transparent', color: '#FF6B35', border: '1px solid #FF6B35', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Redirect</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#09090b', borderBottom: '1px solid #27272a' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>OLD PATH</th>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}></th>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>NEW PATH</th>
                            <th style={{ padding: '16px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Loading redirects...</td></tr>
                        ) : redirects.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>No active redirects. Keep your link juice!</td></tr>
                        ) : redirects.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #27272a' }}>
                                <td style={{ padding: '16px', color: '#fff', fontSize: 13 }}>{r.old_path}</td>
                                <td style={{ padding: '16px' }}><MoveRight size={14} color="#71717a" /></td>
                                <td style={{ padding: '16px', color: '#FF6B35', fontSize: 13, fontWeight: 600 }}>{r.new_path}</td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
