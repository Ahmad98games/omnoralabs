import React from 'react';

export interface ImageBlockProps {
    nodeId: string;
    isBuilder?: boolean;
    src?: string;
    alt?: string;
    width?: 'full' | 'contained' | 'narrow';
    height?: number;
    objectFit?: 'cover' | 'contain' | 'fill';
    link?: string;
    caption?: string;
    borderRadius?: number;
}

const WIDTH_MAP = {
    full: '100vw',
    contained: '1200px',
    narrow: '680px'
};

export const ImageBlock: React.FC<ImageBlockProps> = ({
    nodeId,
    isBuilder = false,
    src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    alt = "Product Showcase",
    width = 'contained',
    height = 400,
    objectFit = 'cover',
    link,
    caption,
    borderRadius = 0
}) => {
    const isFull = width === 'full';
    
    // Clamp full width to 100% in builder to avoid breaking canvas overlays
    const widthStyle = isFull && isBuilder ? '100%' : WIDTH_MAP[width];

    const imgElement = (
        <img 
            src={src} 
            alt={alt}
            style={{
                width: '100%',
                height: `${height}px`,
                objectFit: objectFit,
                borderRadius: `${borderRadius}px`,
                display: 'block',
                transition: 'border-radius 0.2s'
            }}
        />
    );

    return (
        <div 
            data-node-id={nodeId}
            style={{
                width: isFull && !isBuilder ? '100vw' : '100%',
                maxWidth: isFull ? 'none' : widthStyle,
                marginLeft: 'auto',
                marginRight: 'auto',
                left: isFull && !isBuilder ? '50%' : 'auto',
                right: isFull && !isBuilder ? '50%' : 'auto',
                transform: isFull && !isBuilder ? 'translateX(-50%)' : 'none',
                position: isFull && !isBuilder ? 'relative' : 'initial',
                padding: isFull ? '0' : '24px 16px',
            }}
        >
            <figure style={{ margin: 0 }}>
                {link ? (
                    <a href={isBuilder ? undefined : link} style={{ cursor: isBuilder ? 'default' : 'pointer' }}>
                        {imgElement}
                    </a>
                ) : imgElement}
                
                {caption && (
                    <figcaption style={{
                        marginTop: 10,
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#8b8ba0',
                        fontStyle: 'italic'
                    }}>
                        {caption}
                    </figcaption>
                )}
            </figure>
        </div>
    );
};

export default ImageBlock;
