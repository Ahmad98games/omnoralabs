import React from 'react';
import { useRenderPipeline } from '../../context/RenderPipelineContext';
import './RenderPipeline.css';

export const RenderPipelineOverlay: React.FC = () => {
    const { styleVariables } = useRenderPipeline();

    const hasAmbientGlow = styleVariables['--ambient-glow'] !== 'rgba(0, 0, 0, 0)' && styleVariables['--ambient-glow'] !== 'transparent';
    const hasGrain = parseFloat(styleVariables['--grain-opacity'] || '0') > 0;
    const hasGodrays = parseFloat(styleVariables['--godrays-intensity'] || '0') > 0;

    return (
        <svg 
            className="render-pipeline-overlay pointer-events-none fixed inset-0 w-full h-full z-[9999]" 
            style={{ 
                mixBlendMode: 'var(--overlay-blend-mode)' as any,
                opacity: 'var(--neon-intensity)' 
            }}
        >
            <defs>
                {/* 1. Chromatic Aberration Core */}
                <filter id="pipeline-aberration" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="var(--chromatic-aberration)" xChannelSelector="R" yChannelSelector="G" />
                </filter>

                {/* 2. Ambient Neonglow Filter */}
                <filter id="ambient-neon" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="var(--blur-radius)" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* 3. Ambient Grain Filter */}
                <filter id="ambient-grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
                </filter>

                {/* 4. Vignette Gradient */}
                <radialGradient id="vignette-grad" cx="50%" cy="50%" r="75%">
                    <stop offset="50%" stopColor="transparent" />
                    <stop offset="100%" stopColor="rgba(0,0,0,var(--vignette-intensity))" />
                </radialGradient>

                {/* 5. Godrays Gradient */}
                <linearGradient id="godray-cone" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                    <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>

            {/* 1. Ambient Ambient Glow Mesh Overlay */}
            {hasAmbientGlow && <rect width="100%" height="100%" fill="var(--ambient-glow)" style={{ filter: 'url(#ambient-neon)' }} />}

            {/* 2. Ambient Grain Noise Layer */}
            {hasGrain && <rect width="100%" height="100%" filter="url(#ambient-grain)" style={{ mixBlendMode: 'multiply', opacity: 'var(--grain-opacity)' }} />}

            {/* 3. Vignette Shading Layer */}
            <rect width="100%" height="100%" fill="url(#vignette-grad)" style={{ mixBlendMode: 'multiply' }} />

            {/* 4. Cinematic God-Rays */}
            {hasGodrays && (
                <g style={{ opacity: 'var(--godrays-intensity)', mixBlendMode: 'screen', filter: 'blur(20px)' }}>
                    <polygon points="0,0 250,0 900,1400 500,1400" fill="url(#godray-cone)" />
                    <polygon points="100,-100 450,0 1300,1400 900,1400" fill="url(#godray-cone)" />
                    <polygon points="300,-100 100,200 1300,1200 900,1200" fill="url(#godray-cone)" />
                    <polygon points="0,0 150,0 700,1200 400,1200" fill="url(#godray-cone)" />
                </g>
            )}
        </svg>
    );
};
