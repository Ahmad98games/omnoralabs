import React from 'react';
import { motion } from 'framer-motion';

export const FloatingParticles: React.FC = () => {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 4999 }}>
            {[...Array(20)].map((_, i) => {
                const size = Math.random() * 4 + 2;
                const duration = Math.random() * 8 + 6;
                const delay = Math.random() * 5;

                return (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: size,
                            height: size,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 0 10px rgba(255,255,255,0.4)',
                            filter: 'blur(1px)',
                            willChange: 'transform, opacity'
                        }}
                        initial={{
                            x: `${Math.random() * 100}%`,
                            y: '110%',
                            opacity: 0,
                            scale: 0.5
                        }}
                        animate={{
                            y: '-10%',
                            opacity: [0, 0.6, 0.6, 0],
                            scale: [0.5, 1, 1, 0.5],
                            x: [
                                `${Math.random() * 100}%`,
                                `${Math.random() * 100}%`
                            ]
                        }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            delay: delay,
                            ease: 'linear'
                        }}
                    />
                );
            })}
        </div>
    );
};
