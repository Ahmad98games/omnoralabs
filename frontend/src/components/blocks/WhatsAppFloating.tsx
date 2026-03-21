import React from 'react';

export const WhatsAppFloating: React.FC<any> = ({ phoneNumber, welcomeMessage, position = 'right' }) => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(welcomeMessage || '')}`;
    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            style={{
                position: 'fixed', bottom: '24px', [position]: '24px',
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#25D366', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999,
                fontSize: '24px', textDecoration: 'none'
            }}
        >
            💬
        </a>
    );
};
