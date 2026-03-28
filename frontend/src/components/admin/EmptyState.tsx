import React from 'react';
import { Button } from './Layout';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

/**
 * 📭 INDUSTRIAL EMPTY STATE (Task 10.1)
 * Cold minimalist design with dashed borders and high-contrast CTA.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
    title, 
    description, 
    actionLabel, 
    onAction, 
    icon = <PackageOpen size={48} strokeWidth={1} /> 
}) => {
    return (
        <div className="w-full py-20 px-12 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            {/* 🛡️ Industrial Icon (Muted) */}
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/20 mb-6 border border-white/5">
                {icon}
            </div>

            <h2 className="text-xl font-black text-white tracking-tighter uppercase mb-2">{title}</h2>
            <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-8">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button variant="primary" onClick={onAction} className="px-10">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
