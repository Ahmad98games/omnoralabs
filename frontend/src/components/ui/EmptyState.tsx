import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * 🛰️ INDUSTRIAL EMPTY STATE (Task 2.3)
 * Pure Tailwind, zero background, dashed borders, high-contrast CTA.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction 
}) => {
    return (
        <div className="w-full flex flex-col items-center justify-center text-center p-16 border-2 border-dashed border-white/10 rounded-sm bg-transparent selection:bg-white/20 selection:text-black">
            <div className="mb-8 text-white/10">
                <Icon size={64} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">{title}</h3>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/20 max-w-md mb-10 leading-relaxed italic">
                {description}
            </p>
            {actionLabel && onAction && (
                <button 
                    onClick={onAction}
                    className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/90 transition-all active:scale-[0.98]"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
