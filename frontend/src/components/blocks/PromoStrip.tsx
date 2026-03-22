import React, { useState, useEffect } from 'react';

export interface PromoItem {
    text: string;
    link?: string;
}

export interface PromoStripProps {
    nodeId: string;
    isBuilder?: boolean;
    items?: PromoItem[];
    rotationInterval?: number;
    backgroundColor?: string;
    textColor?: string;
    height?: number;
    animationType?: 'slide' | 'fade' | 'none';
}

export const PromoStrip: React.FC<PromoStripProps> = ({
    nodeId,
    isBuilder = false,
    items = [{ text: "Free shipping on orders over $50", link: "" }],
    rotationInterval = 4000,
    backgroundColor = '#7c6dfa',
    textColor = '#ffffff',
    height = 44,
    animationType = 'slide'
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (isBuilder || !items || items.length <= 1) return;

        const id = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % items.length);
        }, rotationInterval);

        return () => clearInterval(id);
    }, [items, rotationInterval, isBuilder]);

    if (!items || items.length === 0) return null;

    const currentItem = items[activeIndex];

    const content = (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <span style={{
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center',
                transition: animationType === 'none' ? 'none' : 'opacity 0.3s ease-in-out',
            }}>
                {currentItem.text}
            </span>
        </div>
    );

    return (
        <div 
            data-node-id={nodeId}
            style={{
                background: backgroundColor,
                color: textColor,
                height: `${height}px`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {currentItem.link && !isBuilder ? (
                <a href={currentItem.link} style={{ color: 'inherit', textDecoration: 'none', width: '100%', height: '100%' }}>
                    {content}
                </a>
            ) : content}
        </div>
    );
};

export default PromoStrip;
