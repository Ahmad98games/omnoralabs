import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';

export const OmnoraBanner: React.FC<{ isStorefront: boolean }> = ({ isStorefront }) => {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let entranceTimer: ReturnType<typeof setTimeout>;
        let exitTimer: ReturnType<typeof setTimeout>;

        // Show banner only if we are on a storefront and haven't dismissed it
        if (isStorefront) {
            const isDismissed = sessionStorage.getItem('omnora_banner_dismissed') === 'true';
            if (!isDismissed) {
                // Slight delay for a smoother entrance
                entranceTimer = setTimeout(() => setIsVisible(true), 1500);
            } else {
                // OSTT FIX: Wrapped in setTimeout to prevent cascading set-state-in-effect
                exitTimer = setTimeout(() => setIsVisible(false), 0);
            }
        } else {
            // OSTT FIX: Wrapped in setTimeout to prevent cascading renders
            exitTimer = setTimeout(() => setIsVisible(false), 0);
        }

        return () => {
            if (entranceTimer) clearTimeout(entranceTimer);
            if (exitTimer) clearTimeout(exitTimer);
        };
    }, [isStorefront]);

    if (!isVisible) return null;

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent clicking the banner
        setIsVisible(false);
        sessionStorage.setItem('omnora_banner_dismissed', 'true');
    };

    const handleClick = () => {
        navigate('/');
    };

    // OSTT FIX: Added keyboard handler for a11y compliance on clickable divs
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div 
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className="fixed bottom-6 right-6 z-50 cursor-pointer group animate-fade-in-up"
        >
            <div className="relative flex items-center gap-3 bg-black border border-white/10 text-white pl-4 pr-10 py-3 rounded-full shadow-2xl hover:border-white/30 transition-all">
                {/* Subtle Industrial Overlay */}
                <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <Sparkles size={16} className="text-white" />
                <span className="text-xs uppercase tracking-widest font-black">
                    POWERED BY <span className="text-white/40">OMNORA KERNEL</span>
                </span>

                <button 
                    type="button" // OSTT FIX: Explicit button type
                    onClick={handleDismiss}
                    className="absolute right-2 p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
OmnoraBanner.displayName = 'OmnoraBanner';