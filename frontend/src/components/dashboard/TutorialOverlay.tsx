import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TutorialStep {
    targetId: string;
    text: string;
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    onComplete: () => void;
    show: boolean;
}

/**
 * TutorialOverlay: Onboarding Spotlight Walkthrough
 * 
 * Uses bounding client rects to draw viewport masks and renders instructions
 * smoothly on elements flawless setups.
 */
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
    steps,
    onComplete,
    show
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    useEffect(() => {
        if (!show || steps.length === 0) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            const el = document.getElementById(step.targetId);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect({
                    top: r.top + window.scrollY,
                    left: r.left + window.scrollX,
                    width: r.width,
                    height: r.height - 10, // adjust height slightly for padding buffers
                });
                
                // Scroll into view if needed
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setRect(null); // Element not found on DOM yet
            }
        };

        // Delay slight tick to ensure components mounted fully
        const timer = setTimeout(updatePosition, 300);
        window.addEventListener('resize', updatePosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
        };
    }, [show, currentStep, steps]);

    if (!show || !rect) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    return (
        <AnimatePresence>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }}>
                {/* SVG Mask Overlay for Spotlight */}
                <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}>
                    <defs>
                        <mask id="spotlight-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <rect 
                                x={rect.left - 8} 
                                y={rect.top - window.scrollY - 8} 
                                width={rect.width + 16} 
                                height={rect.height + 16} 
                                rx="8" 
                                fill="black" 
                            />
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.75)" mask="url(#spotlight-mask)" />
                </svg>

                {/* Info Card Bubble */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        position: 'absolute',
                        top: rect.top + rect.height + 20,
                        left: Math.max(20, rect.left + (rect.width / 2) - 140), // centered but bounded to canvas
                        width: 280,
                        background: '#1c1c24',
                        border: '1px solid #38384d',
                        borderRadius: 8,
                        padding: 16,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        color: '#fff',
                        zIndex: 100000,
                        pointerEvents: 'auto'
                    }}
                >
                    <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: 12, color: '#e4e4e7' }}>
                        {steps[currentStep].text}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>Step {currentStep + 1} of {steps.length}</span>
                        <button 
                            onClick={handleNext}
                            style={{ background: '#6366f1', color: '#fff', padding: '5px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                        >
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
