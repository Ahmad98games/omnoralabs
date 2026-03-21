import React from 'react';

export const StorefrontFallback: React.FC = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09090b',
            color: '#fafafa',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#facc15' }}>🚧 Store Under Construction</h1>
            <p style={{ color: '#a1a1aa', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
                We are currently performing maintenance or upgrading our layout. 
                Please check back in a few moments.
            </p>
        </div>
    );
};
