import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';

export interface RecentlyViewedProps {
    nodeId: string;
    isBuilder?: boolean;
    title?: string;
    limit?: number;
    emptyStateText?: string;
    persistAcrossSessions?: boolean;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
    nodeId,
    isBuilder = false,
    title = 'Recently Viewed',
    limit = 4,
    emptyStateText = 'No history found...',
    persistAcrossSessions = true,
}) => {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (isBuilder) return;
        const storage = persistAcrossSessions ? localStorage : sessionStorage;
        const data = storage.getItem('omnora_v_history');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                setHistory(Array.isArray(parsed) ? parsed.slice(0, limit) : []);
            } catch (err) {
                setHistory([]);
            }
        }
    }, [isBuilder, limit, persistAcrossSessions]);

    const mockHistory = [
        { id: 'm1', title: 'Premium Chronograph', price: 199.99, featured_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' },
        { id: 'm2', title: 'Smart Soundbar X', price: 299.99, featured_image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' },
        { id: 'm3', title: 'Wireless Beats Plus', price: 89.99, featured_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
        { id: 'm4', title: 'Pro Lens 50mm', price: 540.00, featured_image: 'https://images.unsplash.com/photo-1524592093837-8f3893e792fb?w=500' },
    ];

    const activeHistory = isBuilder ? mockHistory : history;

    if (!isBuilder && activeHistory.length === 0) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8b8ba0', fontSize: '14px', fontStyle: 'italic' }}>
                {emptyStateText}
            </div>
        );
    }

    return (
        <section data-node-id={nodeId} style={{ fontFamily: "'Inter', sans-serif" }}>
            {title && <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '24px', letterSpacing: '-0.02em' }}>{title}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {activeHistory.map((item, index) => (
                    <div key={item.id} style={{ position: 'relative' }}>
                        <ProductCard product={{ ...item, price: item.price || 0, title: item.title || '' }} />
                        {isBuilder && (
                            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', color: '#D4AF37', fontSize: '10px', fontWeight: 700, zIndex: 10 }}>
                                Product Preview
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RecentlyViewed;
