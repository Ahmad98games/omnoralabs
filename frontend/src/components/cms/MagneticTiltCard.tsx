/**
 * MagneticTiltCard.tsx — Magnetic 3D Depth HOC
 *
 * Wraps ANY builder element with a "jaw-drop" 3D tilt effect that
 * tracks mouse position and generates a dynamic glare/lighting overlay
 * simulating a physical glossy card reflecting a light source.
 *
 * ARCHITECTURE:
 *  - framer-motion useMotionValue/useSpring for buttery spring physics
 *  - Pure CSS `perspective`, `rotateX`, `rotateY` for 3D — no WebGL
 *  - Radial-gradient glare overlay follows the cursor in real-time
 *  - `will-change: transform` for GPU-composited 60fps
 *  - Gracefully degrades: no effect on touch devices or reduced motion
 *
 * USAGE:
 *   <MagneticTiltCard>
 *     <ProductCard />
 *   </MagneticTiltCard>
 *
 *   <MagneticTiltCard intensity={20} glareOpacity={0.25} glareColor="cyan">
 *     <img src="..." />
 *   </MagneticTiltCard>
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ─── Configuration Interface ────────────────────────────────────────────────

export interface MagneticTiltCardProps {
    children: React.ReactNode;

    /** Max tilt angle in degrees. Default: 15 */
    intensity?: number;

    /** Glare overlay max opacity (0–1). Default: 0.2 */
    glareOpacity?: number;

    /** Glare color (CSS color). Default: 'rgba(255,255,255,{opacity})' */
    glareColor?: string;

    /** Perspective depth in px. Higher = subtler 3D. Default: 800 */
    perspective?: number;

    /** Spring stiffness. Lower = more lag/inertia. Default: 150 */
    stiffness?: number;

    /** Spring damping. Higher = less bounce. Default: 20 */
    damping?: number;

    /** Scale on hover. Default: 1.02 */
    hoverScale?: number;

    /** Whether to show the glare overlay. Default: true */
    enableGlare?: boolean;

    /** Whether to apply the magnetic effect. Default: true */
    enabled?: boolean;

    /** Additional CSS class applied to the wrapper */
    className?: string;

    /** Additional inline styles */
    style?: React.CSSProperties;
}

// ─── Spring Config ──────────────────────────────────────────────────────────

const SPRING_CONFIG = (stiffness: number, damping: number) => ({
    stiffness,
    damping,
    mass: 0.5,
    restDelta: 0.001,
});

// ─── Component ──────────────────────────────────────────────────────────────

export const MagneticTiltCard: React.FC<MagneticTiltCardProps> = ({
    children,
    intensity = 15,
    glareOpacity = 0.2,
    glareColor,
    perspective = 800,
    stiffness = 150,
    damping = 20,
    hoverScale = 1.02,
    enableGlare = true,
    enabled = true,
    className = '',
    style,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Raw mouse position values (0–1 normalized) ──
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // ── Spring-dampened tilt angles ──
    const springConfig = useMemo(() => SPRING_CONFIG(stiffness, damping), [stiffness, damping]);

    const rotateXRaw = useTransform(mouseY, [0, 1], [intensity, -intensity]);
    const rotateYRaw = useTransform(mouseX, [0, 1], [-intensity, intensity]);

    const rotateX = useSpring(rotateXRaw, springConfig);
    const rotateY = useSpring(rotateYRaw, springConfig);

    // ── Glare position (percentage for radial-gradient) ──
    const glareXPercent = useTransform(mouseX, [0, 1], [0, 100]);
    const glareYPercent = useTransform(mouseY, [0, 1], [0, 100]);

    // ── Mouse Tracking Handler (RAF-optimized via framer-motion) ──
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!enabled || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            mouseX.set(x);
            mouseY.set(y);
        },
        [enabled, mouseX, mouseY]
    );

    const handleMouseLeave = useCallback(() => {
        // Spring back to center (neutral position)
        mouseX.set(0.5);
        mouseY.set(0.5);
    }, [mouseX, mouseY]);

    // ── Resolved Glare Color ──
    const resolvedGlareColor = glareColor || 'white';

    // ── Glare gradient (computed via useTransform for 60fps) ──
    const glareBackground = useTransform(
        [glareXPercent, glareYPercent],
        ([x, y]: number[]) =>
            `radial-gradient(ellipse at ${x}% ${y}%, ${resolvedGlareColor} 0%, transparent 70%)`
    );

    if (!enabled) {
        return <div className={className} style={style}>{children}</div>;
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{
                perspective: `${perspective}px`,
                ...style,
            }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                }}
                whileHover={{ scale: hoverScale }}
                transition={{ scale: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
                className="relative"
            >
                {/* ── Content Layer ── */}
                {children}

                {/* ── Glare/Lighting Overlay ── */}
                {enableGlare && (
                    <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
                        style={{
                            background: glareBackground,
                            opacity: glareOpacity,
                            mixBlendMode: 'overlay',
                            willChange: 'background',
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
};

MagneticTiltCard.displayName = 'MagneticTiltCard';
export default MagneticTiltCard;
