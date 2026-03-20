import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resizeImage } from '../../utils/ImageResizer';

export interface OmnoraImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    aspectRatio?: string; // e.g., '16/9', '1/1', '4/3'
    className?: string;
    style?: React.CSSProperties;
    objectFit?: 'cover' | 'contain' | 'fill';
}

/**
 * OmnoraImage: High-Fidelity Smart Image Asset with Lazy Loading and Blur-Up
 * 
 * - Intersection Observer starts loading 200px away from viewport.
 * - Low-res blur placeholders seamlessly transition with `framer-motion`.
 * - Fixed Aspect Ratio avoids layout shift (CLS).
 */
export const OmnoraImage: React.FC<OmnoraImageProps> = ({
    src,
    alt,
    width = 1200,
    height,
    aspectRatio = '16/9',
    className = '',
    style = {},
    objectFit = 'cover',
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate High-resolution & Low-res srcs
    const lowResSrc = resizeImage(src, 20, undefined, 10);
    const highResSrc = resizeImage(src, width, height, 80);
    
    // Fallback handling state
    const [currentSrc, setCurrentSrc] = useState(highResSrc);

    // Sync highResSrc if src changes
    useEffect(() => {
        setCurrentSrc(resizeImage(src, width, height, 80));
    }, [src, width, height]);

    useEffect(() => {
        if (!src) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect(); // Load once
                }
            },
            { rootMargin: '200px' }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [src]);

    if (!src) return null;

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                aspectRatio,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                ...style,
            }}
        >
            {isInView && (
                <AnimatePresence>
                    {!isLoaded && (
                        <motion.img
                            src={lowResSrc}
                            alt={alt}
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                objectFit,
                                filter: 'blur(12px) scale(1.05)',
                                zIndex: 1,
                            }}
                        />
                    )}

                    <motion.img
                        src={currentSrc}
                        alt={alt}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setCurrentSrc('https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&q=80')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLoaded ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            objectFit,
                            zIndex: 2,
                        }}
                    />
                </AnimatePresence>
            )}
        </div>
    );
};
