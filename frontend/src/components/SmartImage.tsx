import React, { useState, useEffect, useCallback } from 'react';
import { FALLBACK_IMAGE } from '../constants'; 
import './SmartImage.css';

interface SmartImageProps {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: string; 
    onLoad?: () => void;
    onError?: () => void;
    priority?: boolean;
}

export default function SmartImage({
    src,
    alt,
    className = '',
    aspectRatio = 'auto',
    onLoad,
    onError,
    priority = false,
}: SmartImageProps) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        // OSTT FIX: Wrap state update in setTimeout to move it out of synchronous render flow
        const timer = setTimeout(() => {
            setStatus('loading');
        }, 0);
        return () => clearTimeout(timer);
    }, [src]);

    const handleLoad = useCallback(() => {
        setStatus('loaded');
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        setStatus('error');
        onError?.();
    }, [onError]);

    const finalSrc = status === 'error' ? FALLBACK_IMAGE : src;

    return (
        <div
            className={`smart-image-container ${className}`}
            style={{ aspectRatio }} 
        >
            <div
                className={`smart-skeleton ${status === 'loaded' ? 'hidden' : ''}`}
                aria-hidden="true"
            />
            <img
                key={src} 
                src={finalSrc}
                alt={alt}
                className={`smart-img ${status === 'loaded' ? 'visible' : ''}`}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
}