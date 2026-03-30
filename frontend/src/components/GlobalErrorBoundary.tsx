import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

// import { trackEvent } from '../api/client';

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // 🚀 Telemetry Disabled for now
        /*
        trackEvent({
            type: 'react_crash',
            path: window.location.pathname,
            payload: {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            }
        });
        */
    }


    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '80px 40px',
                    textAlign: 'center',
                    background: 'var(--obsidian-bg)',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-low)',
                    borderRadius: '16px',
                    margin: '40px'
                }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'rgba(212, 175, 55, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-gold)' }} />
                    </div>
                    <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: 900, 
                        color: '#fff', 
                        marginBottom: '12px',
                        letterSpacing: '-0.02em',
                        fontFamily: 'var(--font-display)' 
                    }}>Runtime Conflict Detected</h2>
                    <p style={{ 
                        color: 'var(--text-ghost)', 
                        maxWidth: '420px', 
                        fontSize: '13px', 
                        lineHeight: 1.6,
                        marginBottom: '32px' 
                    }}>
                        The interface has encountered a synchronization discrepancy. Diagnostic data has been logged. Please refresh to re-establish the primary link.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: 'var(--surface-high)',
                            border: '1px solid var(--border-low)',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Synchronize Client
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
