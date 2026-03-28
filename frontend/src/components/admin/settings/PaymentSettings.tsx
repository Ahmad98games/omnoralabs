import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Zap, Info, ExternalLink, Settings2, Trash2, Plus } from 'lucide-react';

/**
 * 💳 PAYMENT SETTINGS (Task 3.5)
 * Industrial-grade setup for Stripe Connect and multiple gateways.
 */
export const PaymentSettings: React.FC = () => {
    const [testMode, setTestMode] = useState(true);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl px-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Payment Gateways</h1>
                    <p className="text-zinc-500 text-sm">Configure how you receive money from customers. We recommend Stripe for the best experience.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase ml-2">Test Mode</span>
                    <button 
                        onClick={() => setTestMode(!testMode)}
                        className={`w-12 h-6 rounded-full transition-all relative ${testMode ? 'bg-orange-500/20' : 'bg-zinc-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${testMode ? 'right-1 bg-orange-500' : 'left-1 bg-zinc-600'}`} />
                    </button>
                </div>
            </header>

            {/* 1. Primary: Stripe Connect */}
            <div className="bg-[#635BFF]/5 border border-[#635BFF]/20 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#635BFF]/10 blur-[120px] -z-10 group-hover:bg-[#635BFF]/20 transition-all duration-700" />
                
                <div className="flex justify-between items-start">
                    <div className="space-y-4 max-w-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                <svg viewBox="0 0 60 25" className="w-8 h-8 fill-[#635BFF]"><path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.27 2.55 1.61 0 2.98-.37 3.91-.88l.79 2.44c-1.27.72-3.19 1.19-5.23 1.19-4.89 0-7.37-2.7-7.37-7.29 0-4.84 2.72-7.37 6.89-7.37 4.22 0 6.07 2.54 6.07 6.58 0 .58-.05 1.34-.27 2.78zm-3.18-2.46c0-1.63-.71-2.42-1.99-2.42-1.32 0-2.22.82-2.39 2.42h4.38zM31.2 5.07c-1.89 0-3.37.58-4.06 1.25V.33l-4.52.95v17.47c1.33.56 3.03.95 4.88.95 4.65 0 8.01-2.43 8.01-7.14 0-4.72-2.58-7.49-4.31-7.49zm-1.03 10.3c-1.07 0-1.76-.36-2.5-1.02V9.32c.74-.66 1.45-1.02 2.5-1.02 1.63 0 2.46 1.43 2.46 3.52 0 2.08-.83 3.55-2.46 3.55zm-15.01-1.03c0 2.22 1.83 2.9 3.54 2.9.91 0 1.62-.05 2.11-.18v-2.15c-.41.09-.9.13-1.48.13-1.04 0-1.58-.33-1.58-1.28V9.45h3.06V5.37h-3.06V2.31L15.16 3v2.37h-1.93v4.08h1.93v4.89zm-4.73-1.48c0-3.26-1.92-3.8-3.41-3.8-.91 0-1.58.14-1.98.37v6.84c.39.23 1.07.37 1.98.37 1.49 0 3.41-.54 3.41-3.78zM.36 10.15c0 4.84 2.55 7.14 6.43 7.14 2.05 0 3.82-.47 5-.94v-3.05c-1.12.42-2.44.75-3.69.75-1.83 0-2.81-.88-2.81-2.61V.33L.36 1.28v8.87z"/></svg>
                            </div>
                            <span className="text-white font-black text-xl tracking-tight">Stripe Connect</span>
                        </div>
                        <h2 className="text-white text-lg font-bold leading-snug">The best way to accept payments.</h2>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-zinc-400 text-xs">
                                <ShieldCheck size={14} className="text-[#635BFF]" /> Accept Apple Pay, Google Pay, and Credit Cards out-of-the-box.
                            </li>
                            <li className="flex items-center gap-2 text-zinc-400 text-xs">
                                <Zap size={14} className="text-[#635BFF]" /> 2-day rolling payouts directly to your bank account.
                            </li>
                        </ul>
                        <button className="bg-[#635BFF] hover:bg-[#7a73ff] text-white font-black px-8 py-3 rounded-xl transition-all flex items-center gap-2 text-sm shadow-xl shadow-[#635BFF]/20">
                            Connect Stripe Account <ExternalLink size={16} />
                        </button>
                    </div>
                    
                    <div className="bg-zinc-950/40 border border-[#635BFF]/20 p-4 rounded-xl backdrop-blur-sm">
                        <div className="text-[10px] font-black text-[#635BFF] uppercase mb-4">Payout Schedule</div>
                        <div className="flex gap-1 items-end h-20">
                            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                <div key={i} className="flex-1 bg-[#635BFF]/30 rounded-t-sm hover:bg-[#635BFF] transition-all" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Alternative Gateways */}
            <div className="grid grid-cols-2 gap-6">
                <GatewayCard 
                    name="PayPal" 
                    icon={<div className="text-[#003087] font-black italic">PayPal</div>}
                    description="Allow customers to pay via PayPal balance or Credit Card."
                    status="disconnected"
                />
                <GatewayCard 
                    name="Manual Payment" 
                    icon={<CreditCard className="text-zinc-500" />}
                    description="Cash on Delivery, Bank Transfer, or In-store Pickup."
                    status="active"
                />
            </div>
        </div>
    );
};

const GatewayCard = ({ name, icon, description, status }: any) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between group">
        <div>
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-black border border-zinc-800 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                    {status}
                </div>
            </div>
            <h3 className="text-white font-bold mb-1">{name}</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
        </div>
        <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between">
            <button className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest">Configure</button>
            <button className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
            </button>
        </div>
    </div>
);
