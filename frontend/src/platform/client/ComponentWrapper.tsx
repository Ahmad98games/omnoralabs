import React, { useRef, useState, useEffect, useMemo } from 'react';

// ─── Animation Presets ────────────────────────────────────────────────────────

interface AnimationConfig {
    type: 'fadeIn' | 'slideUp' | 'zoomIn' | 'blurReveal' | 'none';
    duration: number;
    delay: number;
    once: boolean;
}

const ANIM_INITIAL: Record<string, React.CSSProperties> = {
    fadeIn: { opacity: 0 },
    slideUp: { opacity: 0, transform: 'translateY(40px)' },
    zoomIn: { opacity: 0, transform: 'scale(0.85)' },
    blurReveal: { opacity: 0, filter: 'blur(12px)' },
};

const ANIM_FINAL: Record<string, React.CSSProperties> = {
    fadeIn: { opacity: 1 },
    slideUp: { opacity: 1, transform: 'translateY(0)' },
    zoomIn: { opacity: 1, transform: 'scale(1)' },
    blurReveal: { opacity: 1, filter: 'blur(0px)' },
};

export interface ComponentWrapperProps {
    nodeId: string;
    type: string;
    children: React.ReactNode;
    isHidden?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    animations?: AnimationConfig;
}

/**
 * ComponentWrapper: The atomic structural unit of Omnora (Client/Live).
 * 
 * OS.PURITY: This component has ZERO dependencies on BuilderContext.
 * It is responsible for pure layout, visibility, basic DOM structure,
 * and Phase 12 scroll-triggered CSS animations.
 */
export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
    nodeId,
    type,
    children,
    isHidden,
    style,
    className = '',
    onClick,
    onMouseEnter,
    onMouseLeave,
    animations,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [animVisible, setAnimVisible] = useState(false);
    const hasAnim = animations && animations.type && animations.type !== 'none';

    // IntersectionObserver for live scroll-triggered animations
    useEffect(() => {
        if (!hasAnim) return;
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setAnimVisible(true);
                    if (animations?.once !== false) obs.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasAnim, animations?.once]);

    const animStyle: React.CSSProperties = useMemo(() => {
        if (!hasAnim || !animations) return {};
        const dur = animations.duration ?? 600;
        const del = animations.delay ?? 0;
        const initial = ANIM_INITIAL[animations.type] || {};
        const final_ = ANIM_FINAL[animations.type] || {};
        const active = animVisible ? final_ : initial;
        return {
            ...active,
            transition: `opacity ${dur}ms ease ${del}ms, transform ${dur}ms ease ${del}ms, filter ${dur}ms ease ${del}ms`,
        };
    }, [hasAnim, animations, animVisible]);

    return (
        <div
            ref={ref}
            id={nodeId}
            className={`omnora-component ${type.toLowerCase()} ${className} ${isHidden ? 'is-hidden' : ''}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'relative',
                width: '100%',
                opacity: isHidden ? 0.3 : 1,
                ...style,
                ...animStyle,
            }}
            data-omnora-node={nodeId}
            data-omnora-type={type}
        >
            {children}

            <style>{`
                .omnora-component {
                    transition: opacity 0.3s ease;
                }
                @media print {
                    .is-hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
};

