import React from 'react';

export const StoreTemporarilyPaused: React.FC<{ logoSrc?: string }> = ({ logoSrc }) => {
    return (
        <div style={{
            minHeight: '100vh', 
            background: '#050508', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                textAlign: 'center',
                padding: '44px 32px',
                maxWidth: '440px',
                background: '#0d0d12',
                borderRadius: '24px',
                border: '1px solid #1a1a24',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                     {logoSrc ? (
                          <img src={logoSrc} alt="Store Logo" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                     ) : (
                          <div style={{ 
                               width: 48, height: 48, borderRadius: 14, 
                               background: 'var(--accent-gold, #D4AF37)', 
                               display: 'flex', alignItems: 'center', justifyContent: 'center', 
                               fontSize: 22, color: '#000', fontWeight: 800,
                               boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)'
                          }}>O</div>
                     )}
                </div>

                <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.01em' }}>
                    Store Temporarily Paused
                </h1>
                
                <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
                    This store is temporarily paused. The owner is working on it.
                </p>

                <div style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    color: '#52525b',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                }}>
                    Powered by Omnora OS 🚀
                </div>
            </div>
        </div>
    );
};
