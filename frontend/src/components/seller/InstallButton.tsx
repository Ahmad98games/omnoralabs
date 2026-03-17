import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const InstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!deferredPrompt) return null;

    return (
        <button 
            onClick={handleInstallClick} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#F1D592]/30 bg-[#050505]/40 text-[#F1D592] font-bold text-sm transition-all duration-300 hover:scale-105 hover:bg-[#F1D592]/10 mr-3"
            title="Install Omnora OS"
        >
            <Download size={15} /> Install App
        </button>
    );
};
