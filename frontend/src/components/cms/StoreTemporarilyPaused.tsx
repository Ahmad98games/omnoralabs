import React from 'react';

export const StoreTemporarilyPaused: React.FC = () => {
    return (
        <div style={{
            minHeight: '100vh', 
            background: '#0a0a0f', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                maxWidth: '480px',
                background: '#111',
                borderRadius: '16px',
                border: '1px solid #222'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
                <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
                    Store Under Maintenance
                </h1>
                <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                    This store is currently undergoing routine maintenance and updates. We'll be back online shortly!
                </p>
                <div style={{
                    padding: '12px',
                    background: '#1a1a24',
                    borderRadius: '8px',
                    color: '#666',
                    fontSize: '12px'
                }}>
                    Powered by Omnora OS 🚀
                </div>
            </div>
        </div>
    );
};
