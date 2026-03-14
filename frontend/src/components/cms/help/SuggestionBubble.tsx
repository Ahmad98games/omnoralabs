import React, { useEffect, useState } from 'react';
import { HelpCircle, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuilderInteractionStore } from '../../../hooks/useBuilderInteractionStore';
import { useNavigate } from 'react-router-dom';

const ACCENT = '#6366F1';
const DARK = '#1f2937';

export const SuggestionBubble: React.FC = () => {
    const { state, shouldShowSuggestion, dismissSuggestion, setSuggestionShown } = useBuilderInteractionStore();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (shouldShowSuggestion()) {
            setIsVisible(true);
            setSuggestionShown();
        }
    }, [state, shouldShowSuggestion, setSuggestionShown]);

    const getMessage = () => {
        switch (state.lastFrictionType) {
            case 'misclick':
                return "Need help selecting elements? Click directly on a component to edit it.";
            case 'drag':
                return "Trouble moving things? Sections can only be dropped in highlighted zones.";
            case 'validation':
                return "Not sure about the settings? View the guide for configuration tips.";
            case 'abandoned_media':
                return "Having trouble with images? Learn how media upload works.";
            default:
                return "Need a quick guide on how to use the builder?";
        }
    };

    const handleViewGuide = () => {
        navigate('/builder/help');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        width: 300,
                        background: '#FFFFFF',
                        borderRadius: 16,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                        padding: 16,
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <HelpCircle size={18} color={ACCENT} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                                Quick Tip
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
                                {getMessage()}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={handleViewGuide}
                                    style={{
                                        flex: 2,
                                        height: 32,
                                        background: ACCENT,
                                        border: 'none',
                                        borderRadius: 8,
                                        color: '#FFFFFF',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 4
                                    }}
                                >
                                    View Guide <ArrowRight size={12} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsVisible(false);
                                        dismissSuggestion();
                                    }}
                                    style={{
                                        flex: 1,
                                        height: 32,
                                        background: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: 8,
                                        color: '#4b5563',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 4,
                                color: '#9ca3af',
                                cursor: 'pointer',
                                position: 'absolute',
                                top: 8,
                                right: 8
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
