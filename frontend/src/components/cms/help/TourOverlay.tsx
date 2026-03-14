import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface TourStep {
    target: string; // Selector for element to highlight
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '.builder-section-wrapper',
        title: 'Component Sections',
        content: 'Your page is built from sections. Hover over any part of the canvas to see the component boundaries.',
        position: 'bottom'
    },
    {
        target: '.builder-toolbar-container',
        title: 'Navigation & Viewports',
        content: 'Switch between mobile, tablet, and desktop views to ensure your store looks perfect everywhere.',
        position: 'bottom'
    },
    {
        target: '[data-tour="sidebar-elements"]',
        title: 'The Element Library',
        content: 'Drag new buttons, images, or text blocks directly onto the canvas from here.',
        position: 'right'
    },
    {
        target: '[data-tour="save-button"]',
        title: 'Save & Publish',
        content: 'The builder auto-saves your work, but click Publish when you are ready to go live.',
        position: 'left'
    }
];

interface TourOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            return;
        }

        const updateRect = () => {
            const step = TOUR_STEPS[currentStep];
            const el = document.querySelector(step.target);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        const interval = setInterval(updateRect, 500); // Poll for layout changes
        return () => clearInterval(interval);
    }, [isOpen, currentStep]);

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            pointerEvents: 'none'
        }}>
            {/* Dark Backdrop with Hole */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(2px)',
                pointerEvents: 'auto',
                clipPath: targetRect ? `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)` : 'none',
                transition: 'clip-path 0.3s ease'
            }} />

            {/* Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        position: 'absolute',
                        top: targetRect
                            ? (step.position === 'bottom' ? targetRect.bottom + 20 : step.position === 'top' ? targetRect.top - 200 : targetRect.top)
                            : '50%',
                        left: targetRect
                            ? (step.position === 'right' ? targetRect.right + 20 : step.position === 'left' ? targetRect.left - 320 : targetRect.left + targetRect.width / 2 - 150)
                            : '50%',
                        transform: targetRect ? 'none' : 'translate(-50%, -50%)',
                        width: 300,
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                        pointerEvents: 'auto',
                        zIndex: 100001
                    }}
                >
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 20 }}>{step.content}</p>

                    {!targetRect && (
                        <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={12} /> Target element not found - showing on screen center
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                            Step {currentStep + 1} of {TOUR_STEPS.length}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#9ca3af',
                                    cursor: 'pointer'
                                }}
                            >
                                Skip
                            </button>
                            <button
                                onClick={() => isLastStep ? onClose() : setCurrentStep(s => s + 1)}
                                style={{
                                    background: '#6366F1',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 16px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                {isLastStep ? 'Finish' : 'Next'} <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Target Highlight Ring */}
            {targetRect && (
                <div style={{
                    position: 'absolute',
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    border: '3px solid #6366F1',
                    borderRadius: 8,
                    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'none'
                }} />
            )}
        </div>
    );
};
