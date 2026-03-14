import React, { useEffect, useState } from 'react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { MerchantUser } from '../../platform/core/DatabaseTypes';
import { GeoService, Region } from '../../lib/GeoService';
import { Globe, Loader2, Sparkles } from 'lucide-react';

// Ensure LemonSqueezy types exist globally if injecting the script
declare global {
    interface Window {
        createLemonSqueezy: () => void;
        LemonSqueezy: {
            Url: {
                Open: (url: string) => void;
                Close: () => void;
            };
            Setup: (options: {
                eventHandler: (event: any) => void;
            }) => void;
        };
    }
}

// =========================================================================
// LEMON SQUEEZY PPP CONFIGURATION
// Replace these URLs with the actual Lemon Squeezy product links
// =========================================================================
const LS_GLOBAL_CHECKOUT_URL = 'https://omnoraos.lemonsqueezy.com/buy/pro-subscription';
const LS_SOUTH_ASIA_CHECKOUT_URL = 'https://omnoraos.lemonsqueezy.com/buy/pro-subscription-south-asia';

export default function AdminBillingManager() {
    const [user, setUser] = useState<MerchantUser | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initBilling = async () => {
            try {
                // 1. Fetch current subscription status & geolocation concurrently
                const [currentUser, detectedRegion] = await Promise.all([
                    databaseClient.getCurrentUser(),
                    GeoService.getUserRegion()
                ]);
                
                setUser(currentUser);
                setRegion(detectedRegion);
            } catch (error) {
                console.error("[BillingManager] Initialization error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initBilling();

        // 2. Dynamically inject the Lemon Squeezy script
        const script = document.createElement('script');
        script.src = 'https://assets.lemonsqueezy.com/lemon.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.createLemonSqueezy) {
                window.createLemonSqueezy();
                window.LemonSqueezy.Setup({
                    eventHandler: (event) => {
                        console.log('Lemon Squeezy event:', event);
                        if (event.event === 'Checkout.Success') {
                            // Optimistically update the UI. Real webhook handles actual DB update.
                            setUser(prev => prev ? { ...prev, plan: 'pro' } : null);
                        }
                    }
                });
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const isPro = user?.plan === 'pro';
    const isSouthAsia = region === 'SOUTH_ASIA';

    // Route to the correct Lemon Squeezy URL based on detected region, fallback if env is broken
    const checkoutUrl = (isSouthAsia ? LS_SOUTH_ASIA_CHECKOUT_URL : LS_GLOBAL_CHECKOUT_URL) || 'https://lemonsqueezy.com';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#7c6dfa]" />
                <p className="text-sm font-medium tracking-wide">Initializing Billing Engine...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl font-sans text-white">
            <h2 className="text-2xl font-extrabold mb-2 text-gray-100">
                Subscription & Billing
            </h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                Manage your Omnora OS SaaS subscription. Upgrade to unlock unlimited products,
                custom domains, and complete whitespace branding.
            </p>

            <div className="bg-[#13131a] border border-[#2a2a3a] rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
                
                {/* PPP Background Decoration */}
                {isSouthAsia && !isPro && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                )}

                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h3 className="text-base font-bold text-gray-100 mb-1">Current Tier</h3>
                        <p className="m-0 text-sm text-gray-400">
                            You are currently on the <strong className="text-white capitalize">{user?.plan || 'Free'}</strong> plan.
                        </p>
                    </div>
                    {isPro ? (
                        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider">
                            ACTIVE PRO
                        </div>
                    ) : (
                        <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider">
                            FREE TIER
                        </div>
                    )}
                </div>

                {!isPro && (
                    <div className={`
                        relative border rounded-xl p-6 flex flex-col gap-4 mt-2 overflow-hidden
                        ${isSouthAsia 
                            ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-800/5 border-emerald-500/30' 
                            : 'bg-gradient-to-br from-indigo-900/20 to-indigo-800/5 border-indigo-500/30'
                        }
                    `}>
                        {/* Regional Indicator Pill */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold tracking-wider text-gray-400">
                            <Globe size={12} className={isSouthAsia ? "text-emerald-400" : "text-indigo-400"} />
                            {isSouthAsia ? "SOUTH ASIA REGION" : "GLOBAL REGION"}
                        </div>

                        <div>
                            <h4 className="m-0 text-xl font-extrabold text-gray-100 flex items-center gap-2">
                                Upgrade to Pro
                                {isSouthAsia && <Sparkles size={18} className="text-emerald-400" />}
                            </h4>
                            <p className="mt-2 text-[13px] text-gray-400 leading-relaxed font-medium">
                                • Unlimited Products & Collections<br/>
                                • Custom Domain Binding<br/>
                                • Bring Your Own Key (BYOK) Checkout<br/>
                                • Removal of "Powered by Omnora" badge
                            </p>
                        </div>
                        
                        <div className="flex items-end justify-between mt-4">
                            <div>
                                {isSouthAsia ? (
                                    <>
                                        <div className="text-xs font-bold text-emerald-400 tracking-wider mb-1 uppercase">Regional Support Discount</div>
                                        <div className="text-3xl font-black text-white leading-none">
                                            $5<span className="text-base font-semibold text-gray-500">/mo</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-3xl font-black text-white leading-none">
                                        $29<span className="text-base font-semibold text-gray-500">/mo</span>
                                    </div>
                                )}
                            </div>
                            
                            <a 
                                href={checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                    inline-flex items-center justify-center px-6 py-3 text-white border-none rounded-lg font-bold text-sm cursor-pointer
                                    transition-transform hover:scale-105 active:scale-95 shadow-lg no-underline
                                    ${isSouthAsia 
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-900/50' 
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-900/50'
                                    }
                                `}
                            >
                                Upgrade Now
                            </a>
                        </div>
                    </div>
                )}
                
                {isPro && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                         <div className="bg-[#1a1a24] p-4 rounded-xl border border-white/5">
                             <span className="block text-[11px] text-gray-500 font-bold mb-1 tracking-wider uppercase">Next Billing Date</span>
                             <span className="text-[15px] text-gray-100 font-semibold">Oct 1, 2026</span>
                         </div>
                         <div className="bg-[#1a1a24] p-4 rounded-xl border border-white/5 flex items-center justify-center hover:bg-[#1f1f2b] transition-colors cursor-pointer">
                             <a href="#" className="text-indigo-400 text-[13px] font-bold no-underline flex items-center gap-2">
                                 Manage Billing Portal
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                             </a>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}
