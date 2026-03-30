import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Plus, Type, Image as ImageIcon, Minus } from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    subject: string;
    recipient_type: string;
    status: string;
    created_at: string;
    sent_at?: string;
    sent_count?: number;
    open_count?: number;
    click_count?: number;
}

export const EmailMarketing: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '', subject: '', recipient_type: 'all', status: 'draft'
    });

    const fetchCampaigns = React.useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setCampaigns(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCampaigns();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchCampaigns]);

    const handleCreate = async () => {
        const { error } = await supabase
            .from('email_campaigns')
            .insert({ ...newCampaign });
        if (!error) {
            setIsCreating(false);
            fetchCampaigns();
        }
    };

    const InputStyle: React.CSSProperties = { 
        width: '100%', padding: '12px 16px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 10, color: '#fff', fontSize: '14px', outline: 'none' 
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Email Marketing</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Build campaigns and automated customer flows</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)} 
                        style={{ 
                            padding: '10px 20px', background: '#FF6B35', color: '#fff', borderRadius: 8, 
                            border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', gap: 8,
                            mixBlendMode: 'normal' as React.CSSProperties['mixBlendMode'],
                            opacity: 1 
                        }}
                    >
                        <Plus size={18} /> Create Campaign
                    </button>
                )}
            </div>

            {isCreating && (
                <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, padding: 40, marginBottom: 40 }}>
                     <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 32 }}>New Email Campaign</h2>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#71717a', fontWeight: 700, display: 'block', marginBottom: 12 }}>CAMPAIGN NAME</label>
                            <input placeholder="e.g. Summer Sale 2026" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} style={InputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#71717a', fontWeight: 700, display: 'block', marginBottom: 12 }}>SUBJECT LINE</label>
                            <input placeholder="Don't miss out on 20% off!" value={newCampaign.subject} onChange={e => setNewCampaign({...newCampaign, subject: e.target.value})} style={InputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#71717a', fontWeight: 700, display: 'block', marginBottom: 12 }}>RECIPIENTS</label>
                            <select value={newCampaign.recipient_type} onChange={e => setNewCampaign({...newCampaign, recipient_type: e.target.value})} style={InputStyle}>
                                <option value="all">All Subscribers</option>
                                <option value="high_value">High Value (Spent &gt; $500)</option>
                                <option value="inactive">Inactive 90 Days</option>
                            </select>
                        </div>
                     </div>

                     <div style={{ marginTop: 40, padding: 32, background: '#09090b', border: '1px dashed #27272a', borderRadius: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
                            <div style={{ padding: 12, background: '#131316', borderRadius: 8, color: '#71717a' }}><Type size={20} /></div>
                            <div style={{ padding: 12, background: '#131316', borderRadius: 8, color: '#71717a' }}><ImageIcon size={20} /></div>
                            <div style={{ padding: 12, background: '#131316', borderRadius: 8, color: '#71717a' }}><Minus size={20} /></div>
                        </div>
                        <p style={{ color: '#71717a', fontSize: 13 }}>Click blocks to build your email template</p>
                     </div>

                     <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end' }}>
                        <button onClick={() => setIsCreating(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#71717a', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleCreate} style={{ padding: '10px 24px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save & Continue</button>
                     </div>
                </div>
            )}

            <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#09090b', borderBottom: '1px solid #27272a' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>CAMPAIGN</th>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>SENT</th>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>REACH</th>
                            <th style={{ padding: '16px', fontSize: 11, fontWeight: 700, color: '#71717a' }}>ENGAGEMENT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>Syncing marketing platform...</td></tr>
                        ) : campaigns.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: '#71717a' }}>No campaigns found. Start your first blast!</td></tr>
                        ) : campaigns.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #27272a' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: '#71717a' }}>Sub: {c.subject}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35' }}>{c.status.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#71717a' }}>{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '--'}</td>
                                <td style={{ padding: '16px', fontSize: 13, color: '#fff' }}>{c.sent_count ? c.sent_count : 0}</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ fontSize: 11, color: '#fff' }}><span style={{ color: '#22c55e' }}>{c.open_count || 0}</span> Opens</div>
                                        <div style={{ fontSize: 11, color: '#fff' }}><span style={{ color: '#FF6B35' }}>{c.click_count || 0}</span> Clicks</div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};
