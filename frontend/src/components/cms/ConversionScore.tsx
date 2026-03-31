import React, { useMemo } from 'react';
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
 */
export const ConversionScore: React.FC = () => {
    const storeNodes = useBuilderStore(s => s.nodes[s.activePageId]);

    const audit = useMemo(() => {
        const nodes = storeNodes || [];
        const foundTypes = new Set(nodes.map(n => n.type));
        
        // OSTT FIX: Removed mutable variable inside useMemo loop
        const results = CONVERSION_SIGNALS.map(signal => {
            const isPresent = signal.types.some(type => foundTypes.has(type));
            return { ...signal, isPresent };
        });

        // Calculate score purely
        const score = results.reduce((acc, curr) => curr.isPresent ? acc + curr.weight : acc, 0);

        return { score, results };
    }, [storeNodes]);

    const getScoreColor = (score: number) => {
        if (score > 80) return 'text-white';
        if (score > 50) return 'text-white/70';
        return 'text-white/40';
    };

    return (
        <div className="bg-[#000000] border border-white/10 rounded-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white/30">Registry Integrity</span>
                    <span className={`text-3xl font-black tabular-nums tracking-tighter ${getScoreColor(audit.score)}`}>
                        {audit.score}%
                    </span>
                </div>
                
                <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" fill="transparent" 
                            strokeDasharray={151} 
                            strokeDashoffset={151 - (151 * audit.score) / 100}
                            className={`${getScoreColor(audit.score)} transition-all duration-1000`} 
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-10 pointer-events-none">
                        <div className="w-full border-t border-white" />
                    </div>
                </div>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {audit.results.map(res => (
                    <div key={res.id} className="flex items-center justify-between py-1.5 border-b border-white/5 group last:border-0">
                        <div className="flex items-center gap-3">
                            {res.isPresent ? (
                                <CheckCircle2 size={12} className="text-white" />
                            ) : (
                                <Circle size={12} className="text-white/10" />
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${res.isPresent ? 'text-white' : 'text-white/20'}`}>
                                {res.label}
                            </span>
                        </div>
                        
                        {!res.isPresent && (
                            <button type="button" className="p-1 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {audit.score < 100 && (
                <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-sm flex items-start gap-3">
                    <AlertCircle size={14} className="text-white mt-0.5 shrink-0" />
                    <p className="text-[10px] text-white/60 leading-relaxed font-medium uppercase tracking-tight">
                        Node verification failed. Registry missing: {audit.results.find(r => !r.isPresent)?.label}.
                    </p>
                </div>
            )}
        </div>
    );
};
ConversionScore.displayName = 'ConversionScore';