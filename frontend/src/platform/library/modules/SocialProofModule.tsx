import React, { useState, useEffect, useRef } from 'react';

export interface SocialProofProps {
    enabled?: boolean;
    /** Max frequency — how many seconds between each notification (min: 10) */
    intervalSeconds?: number;
    /** Show recent orders or visitor count */
    type?: 'orders' | 'visitors';
    /** Static sample data — in production wired to real orders API */
    sampleNames?: string[];
    sampleCities?: string[];
    sampleProducts?: string[];
}

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta'];
const NAMES = ['Sara', 'Ahmed', 'Fatima', 'Ali', 'Zara', 'Hassan', 'Ayesha', 'Usman', 'Maryam', 'Bilal'];
const PRODUCTS = ['Check Shirt', 'Lawn Suit', 'Sneakers', 'Watch', 'Handbag', 'Jacket', 'Dress', 'Perfume'];

function random<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

interface Toast { id: number; text: string; }

const SocialProofModule: React.FC<SocialProofProps> = ({
    enabled = true,
    intervalSeconds = 25,
    type = 'orders',
    sampleNames = NAMES,
    sampleCities = CITIES,
    sampleProducts = PRODUCTS,
}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counter = useRef(0);

    const generate = () => {
        const name = random(sampleNames);
        const city = random(sampleCities);
        const product = random(sampleProducts);
        const minsAgo = randomInt(1, 15);
        const text = type === 'orders'
            ? `🛍️ ${name} from ${city} bought ${product} · ${minsAgo} min ago`
            : `👁️ ${randomInt(8, 42)} people are viewing this right now`;
        const id = ++counter.current;
        setToasts(t => [...t.slice(-2), { id, text }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
    };

    useEffect(() => {
        if (!enabled) return;
        const gap = Math.max(10, intervalSeconds) * 1000;
        const timer = setInterval(generate, gap);
        const first = setTimeout(generate, 3000);
        return () => { clearInterval(timer); clearTimeout(first); };
    }, [enabled, intervalSeconds]);

    return (
        <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 900, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340, pointerEvents: 'none' }}>
            {toasts.map(toast => (
                <div key={toast.id} style={{
                    background: 'rgba(13,15,23,0.92)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                    padding: '10px 16px', fontSize: 12, color: '#D1D5DB', lineHeight: 1.4,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    animation: 'socialProofIn 0.35s ease',
                    borderLeft: '3px solid #7c6dfa',
                }}>
                    {toast.text}
                </div>
            ))}
            <style>{`@keyframes socialProofIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
};

export default SocialProofModule;
