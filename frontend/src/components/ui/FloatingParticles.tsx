import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    size: number;
    duration: number;
    delay: number;
    xStart: string;
    xEnd1: string;
    xEnd2: string;
}

export const FloatingParticles: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // OSTT FIX: Wrapped in setTimeout (Macrotask) to prevent synchronous state updates
        // This satisfies the strict 'set-state-in-effect' rule and prevents cascading renders.
        const timer = setTimeout(() => {
            const generatedParticles = [...Array(20)].map(() => ({
                size: Math.random() * 4 + 2,
                duration: Math.random() * 8 + 6,
                delay: Math.random() * 5,
                xStart: `${Math.random() * 100}%`,
                xEnd1: `${Math.random() * 100}%`,
                xEnd2: `${Math.random() * 100}%`
            }));
            
            setParticles(generatedParticles);
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // Do not render motion divs until particles are generated (prevents hydration mismatch)
    if (particles.length === 0) return null;

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 4999 }}>
            {particles.map((p, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.4)',
                        filter: 'blur(1px)',
                        willChange: 'transform, opacity'
                    }}
                    initial={{
                        x: p.xStart,
                        y: '110%',
                        opacity: 0,
                        scale: 0.5
                    }}
                    animate={{
                        y: '-10%',
                        opacity: [0, 0.6, 0.6, 0],
                        scale: [0.5, 1, 1, 0.5],
                        x: [p.xEnd1, p.xEnd2]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: 'linear'
                    }}
                />
            ))}
        </div>
    );
};
FloatingParticles.displayName = 'FloatingParticles';