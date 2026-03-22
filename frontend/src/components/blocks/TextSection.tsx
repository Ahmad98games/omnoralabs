import React from 'react';
import DOMPurify from 'dompurify';

export interface TextSectionProps {
    nodeId: string;
    isBuilder?: boolean;
    heading?: string;
    headingSize?: 'sm' | 'md' | 'lg' | 'xl';
    body?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    ctaStyle?: 'button' | 'link';
    alignment?: 'left' | 'center' | 'right';
    maxWidth?: number;
    paddingY?: number;
}

const HEADING_SIZES = {
    sm: '18px',
    md: '24px',
    lg: '32px',
    xl: '42px'
};

export const TextSection: React.FC<TextSectionProps> = ({
    nodeId,
    isBuilder = false,
    heading,
    headingSize = 'md',
    body = '',
    ctaLabel,
    ctaUrl = '#',
    ctaStyle = 'button',
    alignment = 'center',
    maxWidth = 800,
    paddingY = 60
}) => {
    const sanitizedBody = DOMPurify.sanitize(body);

    return (
        <div 
            data-node-id={nodeId}
            style={{
                padding: `${paddingY}px 16px`,
                fontFamily: "'Inter', -apple-system, sans-serif",
                display: 'flex',
                flexDirection: 'column',
                alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                textAlign: alignment,
            }}
        >
            <div style={{ maxWidth, width: '100%' }}>
                {heading && (
                    <h2 style={{
                        fontSize: HEADING_SIZES[headingSize],
                        fontWeight: 800,
                        color: '#f0f0f5',
                        margin: '0 0 16px',
                        lineHeight: 1.22,
                        letterSpacing: '-0.025em',
                    }}>
                        {heading}
                    </h2>
                )}
                
                {body && (
                    <div 
                        dangerouslySetInnerHTML={{ __html: sanitizedBody }} 
                        style={{
                            fontSize: '15px',
                            color: '#8b8ba0',
                            lineHeight: 1.6,
                            margin: '0 0 24px',
                        }}
                    />
                )}

                {ctaLabel && (
                    ctaStyle === 'button' ? (
                        <a 
                            href={isBuilder ? undefined : ctaUrl}
                            onClick={isBuilder ? e => e.preventDefault() : undefined}
                            style={{
                                display: 'inline-block',
                                padding: '12px 28px',
                                background: '#7c6dfa',
                                color: '#ffffff',
                                borderRadius: 30,
                                fontWeight: 700,
                                fontSize: '14px',
                                textDecoration: 'none',
                                transition: 'transform 0.2s',
                                cursor: isBuilder ? 'default' : 'pointer',
                            }}
                            onMouseEnter={e => { if (!isBuilder) e.currentTarget.style.transform = 'scale(1.03)'; }}
                            onMouseLeave={e => { if (!isBuilder) e.currentTarget.style.transform = 'none'; }}
                        >
                            {ctaLabel}
                        </a>
                    ) : (
                        <a 
                            href={isBuilder ? undefined : ctaUrl}
                            onClick={isBuilder ? e => e.preventDefault() : undefined}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#7c6dfa',
                                fontWeight: 600,
                                fontSize: '14px',
                                textDecoration: 'none',
                                cursor: isBuilder ? 'default' : 'pointer',
                            }}
                        >
                            {ctaLabel} <span>→</span>
                        </a>
                    )
                )}
            </div>
        </div>
    );
};

export default TextSection;
