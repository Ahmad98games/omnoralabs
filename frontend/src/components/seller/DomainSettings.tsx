import React, { useState, useEffect, useCallback } from 'react';
import { Globe, ArrowRight, ShieldCheck, AlertCircle, Lock, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

interface DomainStatus {
    status: 'active' | 'pending' | 'error';
    verified: boolean;
    config?: {
        cname: string;
        a: string;
    };
}

export const DomainSettings: React.FC = () => {
    const { user } = useAuth();
    const isPro = user?.plan === 'pro';
    const [domain, setDomain] = useState('');
    const [currentDomain, setCurrentDomain] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
    const [message, setMessage] = useState('');
    const [statusType, setStatusType] = useState<null | 'success' | 'error'>(null);

    const checkStatus = useCallback(async (domainName: string) => {
        try {
            const res = await client.get(`/domains/${domainName}/status`);
            if (res.data.success) {
                setDomainStatus({
                    status: res.data.status,
                    verified: res.data.verified,
                    config: res.data.config
                });
            }
        } catch (err) {
            console.error("Status check failed", err);
        }
    }, []);

    useEffect(() => {
        const fetchDomain = async () => {
            if (!user?.id) return;
            try {
                const { data } = await supabase
                    .from('merchants')
                    .select('custom_domain')
                    .eq('id', user.id)
                    .single();
                    
                if (data?.custom_domain) {
                    setCurrentDomain(data.custom_domain);
                    setDomain(data.custom_domain);
                    checkStatus(data.custom_domain);
                }
            } catch (err) {
                console.error("Failed to fetch domain", err);
            }
        };
        fetchDomain();
    }, [user?.id, checkStatus]);

    // Polling logic for pending domains
    useEffect(() => {
        if (currentDomain && domainStatus?.status === 'pending') {
            const interval = setInterval(() => checkStatus(currentDomain), 10000);
            return () => clearInterval(interval);
        }
    }, [currentDomain, domainStatus, checkStatus]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPro) return;
        setLoading(true);
        setStatusType(null);
        try {
            let cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase().trim();
            if (!cleanDomain) throw new Error("Please enter a valid domain");

            // 1. Call Backend to add to Vercel
            const res = await client.post('/domains', { domain: cleanDomain });
            
            // 2. Update Supabase
            const { error } = await supabase
                .from('merchants')
                .update({ custom_domain: cleanDomain })
                .eq('id', user?.id || '');

            if (error) throw error;

            setStatusType('success');
            setMessage('Domain connected! Please update your DNS records.');
            setCurrentDomain(cleanDomain);
            checkStatus(cleanDomain);
        } catch (err: any) {
            setStatusType('error');
            setMessage(err.message || 'Failed to connect domain');
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status?: string }) => {
        const isActive = status === 'active';
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                isActive 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 ripple-amber'
            }`}>
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
                {status || 'Pending'}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-4xl mx-auto font-sans text-white h-full overflow-y-auto relative custom-scrollbar">
            {!isPro && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-md rounded-2xl">
                    <div className="text-center max-w-sm space-y-5 p-8">
                        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
                            <Lock size={28} className="text-indigo-400 relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Custom Domains are a Pro Feature</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Upgrade to Pro to connect your own domain and create a white-label experience.</p>
                        <button onClick={() => window.dispatchEvent(new CustomEvent('omnora-switch-tab', { detail: 'billing' }))} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                            <Sparkles size={16} /> Upgrade to Pro — $29/mo
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Custom Domain</h2>
                    <p className="text-gray-400">Connect a custom domain to your sovereign Omnora OS storefront.</p>
                </div>
                {currentDomain && <StatusBadge status={domainStatus?.status} />}
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                    <Globe size={180} />
                </div>
                
                <form onSubmit={handleConnect} className="relative z-10 max-w-xl">
                    <label className="block text-xs font-black text-gray-500 mb-3 uppercase tracking-[0.2em]">
                        Configure Storefront URL
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="e.g. www.yourbrand.com"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-xl"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : currentDomain ? 'Update' : 'Connect'} 
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </div>
                </form>

                {statusType && (
                    <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
                        statusType === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                        {statusType === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {message}
                    </div>
                )}
            </div>

            {currentDomain && (
                <div className="bg-[#050505] border border-indigo-500/10 rounded-2xl p-8 shadow-2xl relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">DNS Verification HUD</h3>
                        </div>
                        <button 
                            onClick={() => { setVerifying(true); checkStatus(currentDomain).finally(() => setVerifying(false)); }}
                            className="text-gray-500 hover:text-white transition-colors"
                            disabled={verifying}
                        >
                            <RefreshCw size={16} className={verifying ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-2xl">
                        Add these records to your domain registrar (GoDaddy, Namecheap, etc.) to point <span className="text-white font-bold">{currentDomain}</span> to the Omnora OS Edge.
                    </p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DnsCard type="CNAME" host="www" value="shops.omnora.com" />
                            <DnsCard type="A" host="@" value="76.76.21.21" />
                            <DnsCard type="TXT" host="_vercel" value="vc-active..." />
                        </div>
                    </div>
                    
                    <div className="mt-8 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-4 text-indigo-300">
                        <AlertCircle size={20} className="mt-0.5 shrink-0 opacity-50" />
                        <div className="text-xs leading-relaxed opacity-80">
                            <strong>Note:</strong> DNS propagation can take 2-48 hours. Once verified, we will automatically provision an SSL certificate for your storefront and secure checkout.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DnsCard = ({ type, host, value }: { type: string, host: string, value: string }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">{type} Record</span>
        <div className="space-y-2">
            <div>
                <span className="text-[10px] text-gray-500 block">Host</span>
                <span className="text-xs font-mono text-white">{host}</span>
            </div>
            <div>
                <span className="text-[10px] text-gray-500 block">Value</span>
                <span className="text-xs font-mono text-indigo-400 truncate block">{value}</span>
            </div>
        </div>
    </div>
);
