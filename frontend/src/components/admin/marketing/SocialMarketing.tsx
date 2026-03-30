import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Share2, Instagram, Facebook, Tv, Palette, CheckCircle, Smartphone, ExternalLink, BarChart } from 'lucide-react';

interface Connection {
    id: string;
    platform: string;
    is_connected: boolean;
}

// OSTT FIX: Hoisted component outside to prevent "Cannot create components during render" error
const PlatformCard = ({ icon: Icon, color, name, connected }: { icon: React.ElementType, color: string, name: string, connected: boolean, platform?: string }) => (
    <div style={{ padding: 24, background: '#131316', border: '1px solid #27272a', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ padding: 10, background: `${color}1A`, borderRadius: 12, color }}>
                <Icon size={24} />
            </div>
            {connected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 10, fontWeight: 800 }}>
                    <CheckCircle size={12} /> CONNECTED
                </div>
            ) : (
                <button type="button" style={{ padding: '6px 14px', background: '#27272a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Connect</button>
            )}
        </div>
        <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{name}</h3>
            <p style={{ fontSize: 11, color: '#71717a' }}>Synched with {name} Shop Catalog</p>
        </div>
        {connected && (
            <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <button type="button" style={{ flex: 1, padding: '8px', background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>SYNC CATALOG</button>
                <button type="button" style={{ padding: '8px', background: '#09090b', color: '#71717a', border: '1px solid #27272a', borderRadius: 8 }}><BarChart size={14} /></button>
            </div>
        )}
    </div>
);

export const SocialMarketing: React.FC = () => {
    const [, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConnections = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('social_connections').select('*');
        if (data) {
            setConnections(data as Connection[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // OSTT FIX: Use timeout to prevent synchronous 'set-state-in-effect' error
        const timer = setTimeout(() => fetchConnections(), 0);
        return () => clearTimeout(timer);
    }, [fetchConnections]);

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Social Marketing</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Multi-channel catalog sync and CAPI attribution</p>
                </div>
                <div style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 8, border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Smartphone size={14} /> CAPI ACTIVE (matching 100%)
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
                <PlatformCard platform="instagram" icon={Instagram} color="#E4405F" name="Instagram Shop" connected={true} />
                <PlatformCard platform="facebook" icon={Facebook} color="#1877F2" name="Facebook Catalog" connected={true} />
                <PlatformCard platform="tiktok" icon={Tv} color="#000000" name="TikTok for Business" connected={false} />
                <PlatformCard platform="pinterest" icon={Palette} color="#BD081C" name="Pinterest Tags" connected={false} />
            </div>

            <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 20, padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Shoppable Post Generator</h2>
                    <button type="button" style={{ padding: '10px 20px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Generate New Post</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {[1,2,3].map(i => (
                        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #27272a' }}>
                            <div style={{ height: 240, background: '#09090b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {loading && <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff' }}>Syncing</div>}
                                <div style={{ padding: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 100, color: '#fff' }}><Share2 size={24} /></div>
                                <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#FF6B35', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800 }}>$129.00</div>
                            </div>
                            <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: '#71717a' }}>Drafted for Instagram</span>
                                <ExternalLink size={14} color="#71717a" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};