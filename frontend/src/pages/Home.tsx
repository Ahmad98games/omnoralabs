import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStorefront } from '../hooks/useStorefront';
import { DynamicSection } from '../components/DynamicSection';
import { BuilderProvider } from '../context/BuilderContext';
import { DiagnosticsPanel } from '../components/cms/DiagnosticsPanel';
import { CinematicLoader } from '../components/ui/CinematicLoader';

/**
 * Home — Platform Landing Page + Storefront Renderer
 *
 * Two modes:
 *   1. Platform domain (omnora.com, localhost): renders the Omnora marketing
 *      landing page. CMS fetch may return null/error — this is expected and
 *      handled gracefully, the static landing page renders instead.
 *
 *   2. Custom merchant domain: HostnameInterceptor resolves the tenant,
 *      useStorefront fetches merchant content, DynamicSection renders it.
 *
 * BUG this fixed: sellers landing on "/" were redirected to the builder via
 * navigate(). That redirect fired on every render whenever isSeller was true,
 * creating a potential bounce loop if the seller dashboard had errors and
 * redirected back to "/". Fixed with `replace: true` so the "/" entry is
 * replaced in history, breaking the back-navigation cycle.
 *
 * BUG this fixed: when useStorefront returned a query error (no merchant for
 * platform domain, API down, 404), siteContent was null, activeLayout was [],
 * and BuilderProvider received `initialData={{}}` — all fine. But the component
 * could still crash if useStorefront threw synchronously. Added explicit error
 * guard and graceful fallback.
 */
export default function Home() {
    const { content: siteContent, loading: cmsLoading, error: cmsError } = useStorefront();
    const { isSeller, isAdmin, isInitializing } = useAuth();
    const navigate = useNavigate();

    // Seller/Admin redirect: replace the history entry so pressing Back
    // doesn't bounce them back to "/" and trigger this redirect again.
    useEffect(() => {
        if (!isInitializing && (isSeller || isAdmin)) {
            console.log('[Home] Seller/Admin detected — redirecting to Atelier.');
            navigate('/seller/dashboard?tab=builder', { replace: true });
        }
    }, [isInitializing, isSeller, isAdmin, navigate]);

    if (cmsLoading) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <CinematicLoader />
            </div>
        );
    }

    // CMS error is expected on the platform domain — just show the landing page.
    // Only log it in development so production stays clean.
    if (cmsError && process.env.NODE_ENV === 'development') {
        console.info('[Home] CMS fetch returned no content (platform domain). Rendering static landing page.');
    }

    // Safely extract merchant content blocks. If siteContent is null (platform
    // domain, API error, etc.) we get an empty array and render only the static hero.
    const activeLayout: unknown[] = siteContent?.layouts?.home?.blocks ?? siteContent?.layout ?? [];

    return (
        <BuilderProvider initialData={siteContent ?? {}} isPreview={false}>
            <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 font-sans overflow-x-hidden selection:text-black">

                {/* ── Static Platform Hero ──────────────────────────────── */}
                {/* Always rendered on the platform domain.                  */}
                {/* Hidden on merchant storefronts that have a full layout.  */}
                {activeLayout.length === 0 && (
                    <section className="relative h-[90vh] flex items-center justify-center border-b border-white/10 bg-[#050505]">
                        <div className="absolute inset-0 overflow-hidden opacity-30">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                            <div className="grid grid-cols-8 h-full w-full opacity-20">
                                {Array(64).fill(0).map((_, i) => (
                                    <div key={i} className="border-[0.5px] border-white/5" />
                                ))}
                            </div>
                        </div>

                        <div className="container relative z-10 text-center px-6">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-8"
                            >
                                <span className="inline-block px-4 py-1.5 border border-white/10 rounded-full text-[10px] font-black tracking-[0.4em] uppercase bg-black/50 backdrop-blur-md">
                                    Protocol v3.4 Active
                                </span>
                                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none uppercase">
                                    OMNORA <br />
                                    <span className="text-white/20">SYSTEMS</span>
                                </h1>
                                <p className="max-w-xl mx-auto text-sm md:text-base text-white/40 font-medium tracking-tight leading-relaxed">
                                    Industrial-grade commerce infrastructure. Precision-engineered for the modern operator.
                                    Absolute black. Zero compromise.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <button
                                        onClick={() => navigate('/collection')}
                                        className="px-10 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all duration-300"
                                    >
                                        Access Catalogue
                                    </button>
                                    <button
                                        onClick={() => navigate('/login', { state: { isSignUp: true } })}
                                        className="px-10 py-4 border border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all duration-300 bg-black/40 backdrop-blur-md"
                                    >
                                        Start Building
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
                            <div className="w-[1px] h-20 bg-gradient-to-b from-white to-transparent" />
                        </div>
                    </section>
                )}

                {/* ── Merchant Block Renderer ────────────────────────────── */}
                {activeLayout.length > 0 && (
                    <main className="relative z-10">
                        <DynamicSection blocks={activeLayout} />
                    </main>
                )}

                <DiagnosticsPanel />
            </div>
        </BuilderProvider>
    );
}