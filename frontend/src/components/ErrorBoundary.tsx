import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'var(--background-color, #fff)',
                    color: 'var(--text-color, #000)'
                }}>
                    <h1 style={{ marginBottom: '1rem' }}>Something went wrong</h1>
                    <p style={{ marginBottom: '2rem', maxWidth: '600px' }}>
                        We're sorry, but an unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre style={{
                            marginTop: '2rem',
                            textAlign: 'left',
                            background: '#f5f5f5',
                            padding: '1rem',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxWidth: '100%'
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }
    
        return this.props.children;
    }
}

export default ErrorBoundary;
