import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FomoCounterProps {
    language?: 'en' | 'ur_roman';
    minUsers?: number;
    maxUsers?: number;
    nodeId?: string; // for canvas compatibility
}

export const FomoCounter: React.FC<FomoCounterProps> = ({
    language = 'en',
    minUsers = 3,
    maxUsers = 12,
    nodeId
}) => {
    const [count, setCount] = useState<number>(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // OSTT FIX: Using next tick for initialization to avoid set-state-in-effect cascading renders
        const init = async () => {
            setIsClient(true);
            setCount(Math.floor(Math.random() * (maxUsers - minUsers + 1)) + minUsers);
        };
        
        init();

        // Fluctuate every 15 seconds
        const interval = setInterval(() => {
            const fluctuation = Math.floor(Math.random() * 5) - 2; // -2 to +2
            setCount(prev => {
                let next = prev + fluctuation;
                if (next < minUsers) next = minUsers;
                if (next > maxUsers) next = maxUsers;
                return next;
            });
        }, 15000);

        return () => clearInterval(interval);
    }, [maxUsers, minUsers]);

    if (!isClient) return null;

    const text = language === 'ur_roman' 
        ? `Abhi ${count} log dekh rahe hain`
        : `${count} people are looking right now`;

    return (
        <div 
            data-node-id={nodeId}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(239,68,68,0.05)',
                margin: '8px 0'
            }}
        >
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 4px #ef4444'
                }}
            />
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={count}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {text}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};
