import React, { useState, useEffect } from 'react';
import { Download, X, Laptop, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install button or customized UI elements
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if it is mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const dismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-2xl backdrop-blur-3xl">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                {isMobile ? <Smartphone size={24} /> : <Laptop size={24} />}
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Install Omnora OS
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                  Experience the next-gen builder directly from your home screen. Fast, secure, and offline-ready.
                </p>
                
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600 active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  >
                    <Download size={14} />
                    Install Now
                  </button>
                  <button
                    onClick={dismiss}
                    className="text-xs font-medium text-neutral-500 transition-colors hover:text-white"
                  >
                    Maybe later
                  </button>
                </div>
              </div>

              <button
                onClick={dismiss}
                className="absolute -right-1 -top-1 rounded-full p-2 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
