import React, { useState } from 'react';
import { useRenderPipeline } from '../../context/RenderPipelineContext';
import { Sliders, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LayerManager: React.FC = () => {
    const { styleVariables, updateStyleVariable, performanceWarning, applyPreset } = useRenderPipeline();
    const [isOpen, setIsOpen] = useState(false);

    const layers = [
        { label: 'Grain Opacity', key: '--grain-opacity', min: 0, max: 0.5, step: 0.01 },
        { label: 'Vignette Intensity', key: '--vignette-intensity', min: 0, max: 1, step: 0.05 },
        { label: 'Godrays Intensity', key: '--godrays-intensity', min: 0, max: 1, step: 0.05 },
        { label: 'Glass Blur', key: '--glass-blur', min: 0, max: 40, step: 1, unit: 'px' },
        { label: 'Particle Opacity', key: '--particle-opacity', min: 0, max: 1, step: 0.05 }
    ];

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 80, zIndex: 10000 }}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: '#1F2937', color: '#fff', border: 'none', borderRadius: 12,
                    width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s'
                }}
            >
                <Sliders size={20} color={isOpen ? '#10B981' : '#fff'} />
            </button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute', bottom: 60, right: 0, width: 280,
                            background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16,
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            padding: 16, fontFamily: 'sans-serif'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
                            <Sparkles size={16} color="#6366F1" />
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827' }}>Visual Layers (Post-FX)</h4>
                        </div>

                        {performanceWarning && (
                            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 11, color: '#B45309', lineHeight: 1.4 }}>
                                ⚠️ {performanceWarning}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {layers.map((layer) => {
                                const valString = styleVariables[layer.key as any] || '0';
                                const numericVal = parseFloat(valString);
                                
                                return (
                                    <div key={layer.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, fontWeight: 500, color: '#4B5563' }}>{layer.label}</span>
                                            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{isNaN(numericVal) ? valString : `${numericVal}${layer.unit || ''}`}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={layer.min}
                                            max={layer.max}
                                            step={layer.step}
                                            value={isNaN(numericVal) ? 0 : numericVal}
                                            onChange={(e) => updateStyleVariable(layer.key as any, `${e.target.value}${layer.unit || ''}`)}
                                            style={{ width: '100%', cursor: 'pointer', accentColor: '#6366F1' }}
                                        />
                                    </div>
                                );
                            })}

                            <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 8, paddingTop: 12 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presets (Base Templates)</span>
                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                    {(['LIT', 'CYBER', 'ETHEREAL'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => applyPreset(p)}
                                            style={{ flex: 1, padding: '4px 0', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', transition: 'all 0.1s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
