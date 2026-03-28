import React, { useState } from 'react';
import { Globe, CheckCircle2, XCircle, AlertCircle, Copy, Loader2 } from 'lucide-react';

/**
 * 🌐 DOMAIN SETTINGS (Task 3.5)
 * Custom Domain connection and DNS verification UI.
 */
export const DomainSettings: React.FC = () => {
    const [domain, setDomain] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [status, setStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>('idle');

    const handleVerify = async () => {
        setIsVerifying(true);
        // 🛡️ DNS VERIFICATION SMOKE TEST (Industrial Rule)
        await new Promise(r => setTimeout(r, 2000));
        setStatus('failed'); // Simulated failure for first attempt
        setIsVerifying(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl px-8">
            <header>
                <h1 className="text-2xl font-bold text-white mb-2">Custom Domain</h1>
                <p className="text-zinc-500 text-sm">Connect your own domain to your Omnora store to professionalize your brand.</p>
            </header>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Connect Domain</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="example.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 ring-orange-500 font-mono text-sm"
                        />
                        <button 
                            onClick={handleVerify}
                            disabled={isVerifying || !domain}
                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black text-xs font-black px-6 rounded-xl transition-all"
                        >
                            {isVerifying ? <Loader2 className="animate-spin" size={16} /> : 'Connect'}
                        </button>
                    </div>
                </div>

                {status === 'failed' && (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-red-500 mt-1 shrink-0" size={16} />
                        <div className="space-y-4">
                            <p className="text-xs text-red-400 leading-relaxed font-bold">
                                DNS verification failed. Please ensure the following records are set in your domain provider (e.g. GoDaddy, Namecheap).
                            </p>
                            
                            <DNSRecord type="A" host="@" value="76.76.21.21" />
                            <DNSRecord type="CNAME" host="www" value="cname.omnora.com" />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-800">
                        <Globe size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Default Omnora Subdomain</div>
                        <div className="text-xs text-zinc-500">mystore.omnora.app</div>
                    </div>
                </div>
                <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase rounded-full">Active</div>
            </div>
        </div>
    );
};

const DNSRecord = ({ type, host, value }: any) => (
    <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 flex items-center justify-between group">
        <div className="flex gap-4 items-center">
            <span className="w-12 text-[10px] font-black text-orange-500 bg-orange-500/10 py-1 rounded text-center">{type}</span>
            <span className="text-xs text-zinc-300 font-mono">{host}</span>
            <span className="text-xs text-zinc-500 font-mono">{value}</span>
        </div>
        <button className="text-zinc-500 hover:text-white transition-opacity opacity-0 group-hover:opacity-100">
            <Copy size={14} />
        </button>
    </div>
);
