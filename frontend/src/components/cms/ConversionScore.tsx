import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { CheckCircle2, Circle, AlertCircle, Plus } from 'lucide-react';

interface Signal {
    id: string;
    label: string;
    weight: number;
    types: string[];
}

const CONVERSION_SIGNALS: Signal[] = [
    { id: 'hero', label: 'Hero / Banner', weight: 15, types: ['hero', 'hero_banner'] },
    { id: 'products', label: 'Product Grid', weight: 15, types: ['product_grid'] },
    { id: 'trust', label: 'Trust Badges', weight: 10, types: ['trust_badges'] },
    { id: 'reviews', label: 'Customer Reviews', weight: 10, types: ['customer_reviews'] },
    { id: 'announcement', label: 'Announcement Bar', weight: 10, types: ['announcement_bar'] },
    { id: 'footer', label: 'Site Footer', weight: 10, types: ['site_footer'] },
    { id: 'header', label: 'Store Header', weight: 10, types: ['store_header'] },
    { id: 'scarcity', label: 'Countdown / Promo', weight: 10, types: ['countdown_timer', 'promo_strip'] },
    { id: 'features', label: 'Features / Text', weight: 10, types: ['text_section', 'features_grid'] },
];

/**
 * 📈 CONVERSION SCORE WIDGET (Task 3.2)
 * Audits the current page for industrial-grade conversion signals.
 */
export const ConversionScore: React.FC = () => {
    const { nodes, activePageId } = useBuilderStore(
        useShallow(s => ({
            nodes: s.nodes[s.activePageId] ?? [],
            activePageId: s.activePageId
        }))
    );

    const audit = useMemo(() => {
        const foundTypes = new Set(nodes.map(n => n.type));
        
        let score = 0;
        const results = CONVERSION_SIGNALS.map(signal => {
            const isPresent = signal.types.some(type => foundTypes.has(type));
            if (isPresent) score += signal.weight;
            return { ...signal, isPresent };
        });

        return { score, results };
    }, [nodes]);

    const getScoreColor = (score: number) => {
        if (score > 80) return 'text-green-500';
        if (score > 50) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Conversion Score</span>
                    <span className={`text-2xl font-black ${getScoreColor(audit.score)}`}>
                        {audit.score}%
                    </span>
                </div>
                
                {/* Circular Progress (Minimal) */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            strokeDasharray={126} 
                            strokeDashoffset={126 - (126 * audit.score) / 100}
                            className={`${getScoreColor(audit.score)} transition-all duration-1000`} 
                        />
                    </svg>
                </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {audit.results.map(res => (
                    <div key={res.id} className="flex items-center justify-between py-1 group">
                        <div className="flex items-center gap-2">
                            {res.isPresent ? (
                                <CheckCircle2 size={14} className="text-green-500" />
                            ) : (
                                <Circle size={14} className="text-zinc-700" />
                            )}
                            <span className={`text-xs ${res.isPresent ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {res.label}
                            </span>
                        </div>
                        
                        {!res.isPresent && (
                            <button className="p-1 rounded bg-orange-500/10 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {audit.score < 100 && (
                <div className="mt-4 p-2 bg-orange-500/5 border border-orange-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle size={14} className="text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-orange-400 leading-tight">
                        Missing components identified. Add {audit.results.find(r => !r.isPresent)?.label} to boost conversion potential.
                    </p>
                </div>
            )}
        </div>
    );
};
