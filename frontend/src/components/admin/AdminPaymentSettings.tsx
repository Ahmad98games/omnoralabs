import React, { useState, useEffect } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function AdminPaymentSettings() {
    const { user } = useAuth();
    const isPro = user?.plan === 'pro';
    const [publicKey, setPublicKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        databaseClient.getCurrentUser().then(user => {
            if (user && user.paymentSettings) {
                setPublicKey(user.paymentSettings.stripePublicKey || '');
                setSecretKey(user.paymentSettings.hasStripeConfigured ? '••••••••••••••••••••' : '');
                setWebhookSecret(user.paymentSettings.hasWebhookConfigured ? '••••••••••••••••••••' : '');
            }
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPro) return;
        setIsSaving(true);
        setStatus('idle');
        try {
            const updates: any = {};
            if (publicKey) updates.stripePublicKey = publicKey;
            if (secretKey && !secretKey.startsWith('••••')) updates.stripeSecretKey = secretKey;
            if (webhookSecret && !webhookSecret.startsWith('••••')) updates.stripeWebhookSecret = webhookSecret;
            
            await databaseClient.updateMerchantPaymentSettings(updates);

            setStatus('success');
            if (updates.stripeSecretKey) setSecretKey('••••••••••••••••••••');
            if (updates.stripeWebhookSecret) setWebhookSecret('••••••••••••••••••••');
        } catch (error) {
            console.error('Failed to save payment settings:', error);
            setStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto font-sans text-white relative">
            {/* PRO GUARDRAIL OVERLAY */}
            {!isPro && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-md rounded-2xl">
                    <div className="text-center max-w-sm space-y-5 p-8">
                        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl animate-pulse" />
                            <Lock size={28} className="text-amber-400 relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">BYOK is a Pro Feature</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Free tier uses <span className="font-semibold text-gray-300">Omnora Shared Gateway</span> (5% transaction fee). Upgrade to Pro to use your own Stripe keys with <span className="text-emerald-400 font-bold">0% platform fees</span>.
                        </p>
                        <button 
                            onClick={() => {
                                const event = new CustomEvent('omnora-switch-tab', { detail: 'billing' });
                                window.dispatchEvent(event);
                            }}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                        >
                            <Sparkles size={16} /> Upgrade to Pro — $29/mo
                        </button>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-black mb-2 tracking-tight">
                Payment Settings (BYOK)
            </h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                Configure your Bring-Your-Own-Key (BYOK) Stripe Gateway. This enables your customers
                to check out natively on your storefront, with the funds going directly to your
                connected Stripe account securely.
            </p>

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Stripe Public Key
                    </label>
                    <input 
                        type="text" 
                        value={publicKey} 
                        onChange={e => setPublicKey(e.target.value)} 
                        placeholder="pk_live_..."
                        disabled={!isPro}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono disabled:opacity-40"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Stripe Secret Key <span className="text-red-400">*</span>
                    </label>
                    <input 
                        type="password" 
                        value={secretKey} 
                        onChange={e => setSecretKey(e.target.value)} 
                        placeholder="sk_live_..."
                        disabled={!isPro}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono disabled:opacity-40"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Stripe Webhook Secret <span className="text-red-400">*</span>
                    </label>
                    <input 
                        type="password" 
                        value={webhookSecret} 
                        onChange={e => setWebhookSecret(e.target.value)} 
                        placeholder="whsec_..."
                        disabled={!isPro}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono disabled:opacity-40"
                    />
                    <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1.5">
                        🔒 Your secret keys are stored securely in our encrypted vault and are never exposed to the client browser.
                    </p>
                </div>
                
                <button 
                    type="submit" 
                    disabled={isSaving || !isPro}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Processing...' : 'Save Payment Configuration'}
                </button>

                {status === 'success' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-emerald-400 text-sm font-semibold">
                            ✅ Settings successfully synchronized with the secure vault.
                        </p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-sm font-semibold">
                            ❌ Failed to save securely. Please verify your connection.
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}
