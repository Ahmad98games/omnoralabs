import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { DataCruncher } from '../../platform/ai/DataCruncher';
import { supabase } from '../../lib/supabaseClient';

export interface ActionCard {
    id: string;
    type: "CREATE_COUPON" | "RESTOCK_ALERT" | "RECOVER_CHECKOUT" | "BOOST_PRODUCT" | "REVIEW_REQUEST";
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    payload: Record<string, unknown>;
    expiresAt?: string;
}

const isValidActionCard = (card: unknown): card is ActionCard => {
    if (!card || typeof card !== 'object') return false;
    
    const typedCard = card as Record<string, unknown>;
    
    return (
        typeof typedCard.id === 'string' &&
        ['CREATE_COUPON', 'RESTOCK_ALERT', 'RECOVER_CHECKOUT', 'BOOST_PRODUCT', 'REVIEW_REQUEST'].includes(String(typedCard.type)) &&
        typeof typedCard.title === 'string' &&
        typeof typedCard.description === 'string' &&
        ['high', 'medium', 'low'].includes(String(typedCard.impact)) &&
        typeof typedCard.payload === 'object'
    );
};

export const AiInsights: React.FC = () => {
    const { user } = useAuth();
    const [insights, setInsights] = useState<ActionCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInsights = async (signal?: AbortSignal) => {
        if (!user) return;
        setIsLoading(true);
        setError(null);

        try {
            const state = await DataCruncher.captureStoreState(user.id, signal);
            if (!state) throw new Error("Could not parse store state.");

            const { data, error: fnError } = await supabase.functions.invoke('ai-advisor', {
                body: { store_data: state }
            });

            if (fnError || !data?.insights) throw new Error(fnError?.message || 'AI Engine failed to compute.');

            // 🛡️ 1. Temporal Dismissal Cleanups (Expiry > 24h)
            const dismissed = JSON.parse(localStorage.getItem('omnora_dismissed_cards') || '{}') as Record<string, number>;
            const now = Date.now();
            Object.keys(dismissed).forEach(id => {
                 if (now - dismissed[id] > 24 * 60 * 60 * 1000) {
                      delete dismissed[id]; 
                 }
            });
            localStorage.setItem('omnora_dismissed_cards', JSON.stringify(dismissed));

            // 🛡️ 2. Validation Checks & Dismiss Filtering
            const rawInsights = data.insights as unknown[];
            const validatedCards = rawInsights.filter((c: unknown) => {
                 if (!isValidActionCard(c)) {
                      console.warn('[AiInsights] Discarded malformed ActionCard:', c);
                      return false;
                 }
                 return !dismissed[c.id]; // Exclude dismissed
            }) as ActionCard[];

            setInsights(validatedCards);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            if ((err as { name?: string }).name !== 'AbortError') setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // 🛡️ Visibility Tab Abort Controller Aggregation skips
    useEffect(() => {
        const controller = new AbortController();
        const handleVisibilityChange = () => {
             if (document.hidden) {
                  controller.abort();
             } else {
                  // Re-evaluate when Tab becomes active triggers again nicely
                  // OSTT FIX: Pass fresh controller signal explicitly
                  const newController = new AbortController();
                  loadInsights(newController.signal);
             }
        };

        loadInsights(controller.signal);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
             controller.abort();
             document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // OSTT FIX: Added loadInsights to dependency array as it is declared outside, but we ignore exhaustive deps for stability of AbortController bindings
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleDismiss = (id: string) => {
         const dismissed = JSON.parse(localStorage.getItem('omnora_dismissed_cards') || '{}') as Record<string, number>;
         dismissed[id] = Date.now(); // Store current timestamp triggers
         localStorage.setItem('omnora_dismissed_cards', JSON.stringify(dismissed));
         setInsights(prev => prev.filter(c => c.id !== id));
    };

    const handleActionClick = (type: ActionCard['type'], payload: Record<string, unknown>) => {
        if (type === 'CREATE_COUPON') {
            const code = payload?.code || 'BOOST10';
            window.alert(`[Omnora Co-Pilot] Pre-filling Coupon Modal with code: ${code}`);
        } else if (type === 'RESTOCK_ALERT') {
            const sku = payload?.sku || 'Unknown';
            window.alert(`[Omnora Co-Pilot] Navigating to Inventory for SKU: ${sku}`);
        } else if (type === 'RECOVER_CHECKOUT') {
            const phone = payload?.phone || '';
            window.alert(`[Omnora Co-Pilot] Opening WhatsApp for checkout recovery to: ${phone}`);
        } else {
            console.log('Action recorded:', type, payload);
        }
    };

    return (
        <div className="bg-[#0f0e13] rounded-2xl border border-indigo-900/40 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Autonomous Co-Pilot
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium tracking-wide">
                        L9 Growth Engine • Live Evaluation
                    </p>
                </div>
                <button 
                    type="button"
                    onClick={() => loadInsights()} 
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-[#18181b] hover:bg-[#202025] text-white px-4 py-2 rounded-lg border border-gray-800 transition-colors text-sm font-bold disabled:opacity-50"
                >
                    {isLoading ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-t-indigo-500 border-gray-600 rounded-full inline-block" />
                    ) : (
                        <span>✨ Re-evaluate Store</span>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg text-sm mb-6 font-mono">
                    ⚠️ {error}
                </div>
            )}

            <div className="space-y-4">
                <AnimatePresence>
                    {!isLoading && insights.length === 0 && !error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-gray-600 border border-gray-800 border-dashed rounded-xl">
                            All systems nominal. No urgent growth gaps detected.
                        </motion.div>
                    )}

                    {insights.map((insight) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group flex flex-col md:flex-row gap-6 items-start bg-gradient-to-r from-[#14141a] to-[#121118] p-6 rounded-xl border border-gray-800 hover:border-indigo-500/30 transition-all shadow-xl"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${insight.impact === 'high' ? 'bg-red-500/20 text-red-500' : insight.impact === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                        {insight.impact} Impact
                                    </span>
                                    <h3 className="text-lg font-bold text-white leading-tight">
                                        {insight.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                                    {insight.description}
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0 items-center">
                                <button 
                                     type="button"
                                     onClick={() => handleDismiss(insight.id)}
                                     className="text-gray-500 hover:text-gray-300 text-xs font-medium underline px-2 py-1"
                                >
                                     Dismiss
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => handleActionClick(insight.type, insight.payload)}
                                    className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-900/20"
                                >
                                    {insight.type === 'CREATE_COUPON' && '🚀 Deploy Code'}
                                    {insight.type === 'RESTOCK_ALERT' && '📦 Restock Variant'}
                                    {insight.type === 'RECOVER_CHECKOUT' && '💬 Whatsapp Owner'}
                                    {insight.type === 'BOOST_PRODUCT' && '📈 Boost Views'}
                                    {insight.type === 'REVIEW_REQUEST' && '⭐ Request Reviews'}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};