import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';

export const OmnoraBanner: React.FC<{ isStorefront: boolean }> = ({ isStorefront }) => {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Show banner only if we are on a storefront and haven't dismissed it
        if (isStorefront) {
            const isDismissed = sessionStorage.getItem('omnora_banner_dismissed') === 'true';
            if (!isDismissed) {
                // Slight delay for a smoother entrance
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
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

    return (
        <div 
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 cursor-pointer group animate-fade-in-up"
        >
            <div className="relative flex items-center gap-3 bg-gray-900 border border-gray-800 text-white pl-4 pr-10 py-3 rounded-full shadow-2xl hover:border-indigo-500/50 hover:bg-gray-800 transition-all">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-sm font-medium text-gray-200">
                    Powered by <strong className="text-white">Omnora OS</strong>. Want to build a store like this?
                </span>

                <button 
                    onClick={handleDismiss}
                    className="absolute right-2 p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
