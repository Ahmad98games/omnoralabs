import React from 'react';

export interface WhatsAppFloatingProps {
    phoneNumber: string;
    welcomeMessage?: string;
    position?: 'bottom-right' | 'bottom-left' | 'inline';
    isBuilder?: boolean;
    buttonLabel?: string;
    showPulse?: boolean;
    buttonColor?: string;
    onlyShowOn?: 'all' | 'mobile' | 'desktop';
}

export const WhatsAppFloating: React.FC<WhatsAppFloatingProps> = ({ 
    phoneNumber, 
    welcomeMessage, 
    position = 'bottom-right',
    isBuilder = false,
    buttonLabel = 'Chat on WhatsApp',
    showPulse = true,
    buttonColor = '#25D366',
    onlyShowOn = 'all'
}) => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(welcomeMessage || '')}`;
    
    const isInline = position === 'inline' || isBuilder;
    const isLeft = position === 'bottom-left';

    const pulseKeyframes = `
        @keyframes wp-pulse {
            0% { box-shadow: 0 0 0 0px ${buttonColor}a0; }
            70% { box-shadow: 0 0 0 10px ${buttonColor}00; }
            100% { box-shadow: 0 0 0 0px ${buttonColor}00; }
        }
    `;

    return (
        <>
            {showPulse && <style>{pulseKeyframes}</style>}
            <a 
                href={isBuilder ? undefined : url} 
                target="_blank" 
                rel="noreferrer"
                style={{
                    position: isInline ? 'relative' : 'fixed', 
                    bottom: isInline ? undefined : '24px', 
                    right: isInline ? undefined : isLeft ? undefined : '24px',
                    left: isInline ? undefined : isLeft ? '24px' : undefined,
                    padding: isInline ? '12px 24px' : '0',
                    width: isInline ? 'auto' : '56px', 
                    height: '56px', 
                    borderRadius: isInline ? '28px' : '50%',
                    background: buttonColor, 
                    color: '#fff',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                    zIndex: 9999,
                    fontSize: '15px', 
                    fontWeight: 700,
                    textDecoration: 'none',
                    animation: showPulse ? 'wp-pulse 2s infinite' : 'none',
                    fontFamily: "'Inter', sans-serif",
                    cursor: isBuilder ? 'default' : 'pointer',
                    display: onlyShowOn === 'desktop' && isBuilder ? 'none' : 'flex' // just basic fallback
                }}
            >
                <div style={{ fontSize: 24 }}>💬</div>
                {isInline && <span>{buttonLabel}</span>}
            </a>
        </>
    );
};

export default WhatsAppFloating;
