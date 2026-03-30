import React, { useEffect, useState } from 'react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { MerchantUser } from '../../platform/core/DatabaseTypes';
import { GeoService, Region } from '../../lib/GeoService';
import { Globe, Loader2, Sparkles, ExternalLink } from 'lucide-react';

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
                eventHandler: (event: { event: string }) => void;
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
            <div style={{ display: 'flex', flexDirection: 'column', itemsCenter: 'center', justifyContent: 'center', padding: '100px', color: 'var(--text-ghost)' }}>
                <Loader2 className="animate-spin" style={{ marginBottom: '16px', color: 'var(--accent-gold)' }} />
                <p style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Synchronizing Billing Delta...</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '800px' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Subscription / <span style={{ opacity: 0.4 }}>Access Vault</span>
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-ghost)', marginTop: '8px' }}>Provisioning of enterprise-grade storefront capabilities and global delivery manifests.</p>
            </div>

            <div style={{ 
                background: 'var(--surface-low)', 
                border: '1px solid var(--border-low)', 
                borderRadius: '16px', 
                padding: '40px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Visual Accent */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: isSouthAsia ? 'var(--accent-gold)' : '#fff', opacity: 0.03, filter: 'blur(100px)', borderRadius: '50%' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Deployment Tier</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>
                            {user?.plan?.toUpperCase() || 'STANDARD CORE'}
                        </div>
                    </div>
                    {isPro ? (
                        <span className="pill pill-success">Enterprise Active</span>
                    ) : (
                        <span className="pill pill-pending">Standard Latency</span>
                    )}
                </div>

                {!isPro && (
                    <div style={{ 
                        background: 'var(--surface-mid)', 
                        border: '1px solid var(--border-mid)',
                        borderRadius: '12px',
                        padding: '32px',
                        marginTop: '24px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h4 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Elevate to Enterprise
                                    {isSouthAsia && <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />}
                                </h4>
                                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--accent-gold)', borderRadius: '50%' }} />
                                        Unlimited Vault Capacity (Products)
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--accent-gold)', borderRadius: '50%' }} />
                                        Custom Encryption Domain Binding
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--accent-gold)', borderRadius: '50%' }} />
                                        Advanced Settlement Key (BYOK)
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--accent-gold)', borderRadius: '50%' }} />
                                        Complete Whitespace Neutrality
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-high)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-low)' }}>
                                <Globe size={12} style={{ color: isSouthAsia ? 'var(--accent-gold)' : 'var(--text-ghost)' }} />
                                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase' }}>
                                    {isSouthAsia ? "South Asia Protocol" : "Global Standard"}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
                            <div>
                                {isSouthAsia ? (
                                    <>
                                        <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '4px' }}>Regional Parity Applied</div>
                                        <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                                            $5<span style={{ fontSize: '14px', color: 'var(--text-ghost)', fontWeight: 400 }}>/m</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                                        $29<span style={{ fontSize: '14px', color: 'var(--text-ghost)', fontWeight: 400 }}>/m</span>
                                    </div>
                                )}
                            </div>

                            <a 
                                href={checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: isSouthAsia ? 'var(--accent-gold)' : '#fff',
                                    color: '#000',
                                    padding: '12px 32px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    textDecoration: 'none',
                                    textTransform: 'uppercase',
                                    transition: 'transform 0.2s',
                                    display: 'inline-block'
                                }}
                            >
                                Authorize Upgrade
                            </a>
                        </div>
                    </div>
                )}

                {isPro && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                        <div style={{ background: 'var(--surface-mid)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-mid)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', marginBottom: '8px' }}>Security Cycle Reset</div>
                            <div style={{ fontSize: '15px', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>OCT 01, 2026</div>
                        </div>
                        <div style={{ background: 'var(--surface-mid)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <a href="#" style={{ color: 'var(--accent-gold)', fontSize: '12px', fontWeight: 900, textDecoration: 'none', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Billing Access Portal
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
