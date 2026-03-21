import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { DataCruncher } from '../../../platform/ai/DataCruncher';
import { supabase } from '../../../lib/supabaseClient';

interface Insight {
    title: string;
    description: string;
    impact_score: number;
    action_type: 'CREATE_COUPON' | 'RESTOCK_ITEM' | 'PAUSED_WARNING' | 'GENERIC';
    suggested_payload?: any;
}

export const AiInsights: React.FC = () => {
    const { user } = useAuth();
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInsights = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);

        try {
            // 1. Pull hyper-dense store state using DataCruncher natively
            const state = await DataCruncher.captureStoreState(user.id);
            if (!state) throw new Error("Could not parse store state.");

            // 2. Transmit to Edge LLM gateway
            const { data, error: fnError } = await supabase.functions.invoke('ai-advisor', {
                body: { store_data: state }
            });

            if (fnError || !data?.insights) throw new Error(fnError?.message || 'AI Engine failed to compute.');

            setInsights(data.insights);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch on mount
    useEffect(() => {
        loadInsights();
    }, [user]);

    const handleActionClick = (actionType: string, payload: any) => {
        if (actionType === 'CREATE_COUPON') {
            const code = payload?.code || 'BOOST10';
            // Trigger global Modal/Toast or navigate natively to coupon builder
            window.alert(`[Omnora Co-Pilot Engine]\nRouting to Coupon Manager to auto-generate: ${code}`);
        } else if (actionType === 'RESTOCK_ITEM') {
            const sku = payload?.sku || 'Unknown';
            window.alert(`[Omnora Co-Pilot Engine]\nRouting to Inventory Matrix to replenish SKU: ${sku}`);
        } else {
            console.log('Action recorded:', actionType, payload);
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
                    onClick={loadInsights} 
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

                    {insights.map((insight, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group flex flex-col md:flex-row gap-6 items-start bg-gradient-to-r from-[#14141a] to-[#121118] p-6 rounded-xl border border-gray-800 hover:border-indigo-500/30 transition-all shadow-xl"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${insight.impact_score > 7 ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                        Impact: {insight.impact_score}/10
                                    </span>
                                    <h3 className="text-lg font-bold text-white leading-tight">
                                        {insight.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                                    {insight.description}
                                </p>
                            </div>

                            {insight.action_type !== 'GENERIC' && (
                                <button 
                                    onClick={() => handleActionClick(insight.action_type, insight.suggested_payload)}
                                    className="shrink-0 w-full md:w-auto mt-4 md:mt-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-900/20"
                                >
                                    {insight.action_type === 'CREATE_COUPON' && '🚀 Deploy Recovery Code'}
                                    {insight.action_type === 'RESTOCK_ITEM' && '📦 Open Variant Matrix'}
                                    {insight.action_type === 'PAUSED_WARNING' && '💳 Top Up Wallet'}
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
