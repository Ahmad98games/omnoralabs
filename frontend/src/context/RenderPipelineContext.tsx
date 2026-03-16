import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface DynamicStyleState {
    '--ambient-glow': string;
    '--chromatic-aberration': string;
    '--neon-intensity': string;
    '--particle-opacity': string;
    '--blur-radius': string;
    '--glass-blur': string;
    '--accent-color': string;
    '--font-kerning': string;
    '--overlay-blend-mode': string;
    '--grain-opacity': string;
    '--vignette-intensity': string;
    '--godrays-intensity': string;
}

export type PresetName = 'LIT' | 'CYBER' | 'ETHEREAL';

interface RenderPipelineContextType {
    styleVariables: DynamicStyleState;
    updateStyleVariable: (key: keyof DynamicStyleState, value: string) => void;
    performanceWarning: string | null;
    applyPreset: (preset: PresetName) => void;
}

const RenderPipelineContext = createContext<RenderPipelineContextType | undefined>(undefined);

const PRESETS: Record<PresetName, Partial<DynamicStyleState>> = {
    LIT: {
        '--ambient-glow': 'rgba(255, 0, 85, 0.15)',
        '--chromatic-aberration': '1px',
        '--neon-intensity': '1',
        '--particle-opacity': '0.3',
        '--blur-radius': '4px',
        '--glass-blur': '8px',
        '--accent-color': '#ff0055',
        '--font-kerning': '0.05em',
        '--overlay-blend-mode': 'overlay',
        '--grain-opacity': '0.08',
        '--vignette-intensity': '0.4',
        '--godrays-intensity': '0'
    },
    CYBER: {
        '--ambient-glow': 'rgba(0, 255, 204, 0.25)',
        '--chromatic-aberration': '2.5px',
        '--neon-intensity': '2',
        '--particle-opacity': '0.7',
        '--blur-radius': '8px',
        '--glass-blur': '16px',
        '--accent-color': '#00ffcc',
        '--font-kerning': '0.1em',
        '--overlay-blend-mode': 'screen',
        '--grain-opacity': '0.15',
        '--vignette-intensity': '0.6',
        '--godrays-intensity': '0.5'
    },
    ETHEREAL: {
        '--ambient-glow': 'rgba(255, 255, 255, 0.08)',
        '--chromatic-aberration': '0.3px',
        '--neon-intensity': '0.4',
        '--particle-opacity': '0.15',
        '--blur-radius': '2px',
        '--glass-blur': '4px',
        '--accent-color': '#6366F1',
        '--font-kerning': 'normal',
        '--overlay-blend-mode': 'overlay',
        '--grain-opacity': '0.03',
        '--vignette-intensity': '0.2',
        '--godrays-intensity': '0.3'
    }
};

const DEFAULT_STYLE: DynamicStyleState = {
    '--ambient-glow': 'rgba(0, 0, 0, 0)',
    '--chromatic-aberration': '0px',
    '--neon-intensity': '0',
    '--particle-opacity': '0',
    '--blur-radius': '0px',
    '--glass-blur': '2px',
    '--accent-color': '#C9A063',
    '--font-kerning': '0.05em',
    '--overlay-blend-mode': 'normal',
    '--grain-opacity': '0.02',
    '--vignette-intensity': '0.2',
    '--godrays-intensity': '0'
};

export const RenderPipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [styleVariables, setStyleVariables] = useState<DynamicStyleState>(DEFAULT_STYLE);
    const [performanceWarning, setPerformanceWarning] = useState<string | null>(null);

    const updateStyleVariable = useCallback((key: keyof DynamicStyleState, value: string) => {
        setStyleVariables(prev => {
            const next = { ...prev, [key]: value };
            
            // Performance Detective 🕵️‍♂️
            const blurVal = parseInt(next['--blur-radius'] || '0') || 0;
            const glassBlurVal = parseInt(next['--glass-blur'] || '0') || 0;
            
            if (blurVal > 15 || glassBlurVal > 20) {
                setPerformanceWarning("High Blur Warning: Heavy backdrop-filters can impact frame depth performance on standard mobile tier nodes.");
            } else {
                setPerformanceWarning(null);
            }

            return next;
        });
    }, []);

    const applyPreset = useCallback((preset: PresetName) => {
        setStyleVariables(prev => ({
            ...prev,
            ...PRESETS[preset]
        }));
        setPerformanceWarning(null); // Presets are optimized
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        
        // 1. Apply Dynamic CSS Variables to Document Root
        Object.entries(styleVariables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

    }, [styleVariables]);

    return (
        <RenderPipelineContext.Provider value={{ styleVariables, updateStyleVariable, performanceWarning, applyPreset }}>
            {children}
        </RenderPipelineContext.Provider>
    );
};

export const useRenderPipeline = () => {
    const context = useContext(RenderPipelineContext);
    if (!context) throw new Error('useRenderPipeline must be used within RenderPipelineProvider');
    return context;
};
