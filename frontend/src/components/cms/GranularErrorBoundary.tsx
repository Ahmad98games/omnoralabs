import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackEvent } from '../../api/client';

interface Props {
    nodeId: string;
    nodeType: string;
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorMsg: string;
}

/**
 * GranularErrorBoundary — Omnora OS v5.0
 *
 * Wraps an individual CMS node render. If the node component throws during
 * rendering, only THAT block shows a fallback — the rest of the canvas
 * continues operating normally.
 *
 * Key behaviours:
 *   - Resets via "Restore Module" button (no page reload needed).
 *   - Reports crash telemetry via trackEvent (error message is NOT shown in UI).
 *   - Styled in the Omnora "Industrial Luxury" dark aesthetic.
 */
class GranularErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorMsg: '',
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            errorMsg: error.message,
        };
    }

    public componentDidCatch(error: Error, info: ErrorInfo) {
        // Report to telemetry — never surface raw error to UI.
        trackEvent({
            type: 'canvas_node_crash',
            path: window.location.pathname,
            payload: {
                nodeId: this.props.nodeId,
                nodeType: this.props.nodeType,
                message: error.message,
                componentStack: info.componentStack,
            },
        }).catch(() => { /* swallow secondary telemetry failure */ });
    }

    private handleRestore = () => {
        this.setState({ hasError: false, errorMsg: '' });
    };

    public render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const { nodeType, nodeId } = this.props;

        return (
            <div
                data-node-id={nodeId}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 32px',
                    margin: '4px 0',
                    background: '#0a0a0b',
                    border: '1px solid rgba(197, 86, 86, 0.35)',
                    borderLeft: '3px solid #C55',
                    borderRadius: '6px',
                    gap: '16px',
                    textAlign: 'center',
                    fontFamily: "'Inter', system-ui, sans-serif",
                }}
            >
                {/* Module type label */}
                <div style={{
                    fontSize: '8px',
                    fontWeight: 900,
                    letterSpacing: '0.18em',
                    color: 'rgba(197,86,86,0.7)',
                    textTransform: 'uppercase',
                }}>
                    Component Offline
                </div>

                {/* Node type identifier */}
                <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.9)',
                    textTransform: 'uppercase',
                }}>
                    [{nodeType}]
                </div>

                {/* Sub-label */}
                <p style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.3)',
                    margin: '0',
                    maxWidth: '260px',
                    lineHeight: '1.6',
                }}>
                    This module encountered a rendering error. The rest of your
                    storefront is unaffected.
                </p>

                {/* Restore button */}
                <button
                    onClick={this.handleRestore}
                    style={{
                        marginTop: '8px',
                        padding: '10px 24px',
                        background: 'transparent',
                        color: 'rgba(197, 160, 89, 0.85)',
                        border: '1px solid rgba(197, 160, 89, 0.4)',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        // pointer-events must remain active even in edit mode
                        pointerEvents: 'auto',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(197, 160, 89, 0.08)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(197, 160, 89, 0.8)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(197, 160, 89, 1)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(197, 160, 89, 0.4)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(197, 160, 89, 0.85)';
                    }}
                >
                    Restore Module
                </button>
            </div>
        );
    }
}

export default GranularErrorBoundary;
