import React from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Activity, XCircle, MousePointer2, Type, Zap } from 'lucide-react';

export const DiagnosticsPanel: React.FC = () => {
    const { diagnostics, setDiagnostics, isTyping, interactionPriority, selectedNodeId, editingInfo } = useBuilder();

    if (!diagnostics.showPanel) {
        return (
            <button
                onClick={() => setDiagnostics({ showPanel: true })}
                style={{
                    position: 'fixed', bottom: 16, left: 16,
                    background: 'rgba(31, 41, 55, 0.8)', color: '#9CA3AF',
                    padding: '8px', borderRadius: '50%', border: '1px solid rgba(75, 85, 99, 0.5)',
                    cursor: 'pointer', zIndex: 99999, backdropFilter: 'blur(8px)',
                }}
                title="Open Performance Diagnostics"
            >
                <Activity size={18} />
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed', bottom: 16, left: 16,
            width: 280, background: '#111827', border: '1px solid #374151',
            borderRadius: 12, padding: 16, color: '#f3f4f6',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            fontFamily: 'monospace', fontSize: 11, zIndex: 99999,
            display: 'flex', flexDirection: 'column', gap: 12,
            backdropFilter: 'blur(12px)', borderLeft: '4px solid #ef4444'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#ef4444' }}>
                    <Zap size={14} /> DIAGNOSTICS
                </div>
                <button
                    onClick={() => setDiagnostics({ showPanel: false })}
                    style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
                >
                    <XCircle size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#1f2937', padding: 8, borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Active Mode:</span>
                    <span style={{ color: isTyping ? '#34d399' : '#60a5fa', fontWeight: 700 }}>{interactionPriority.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Status:</span>
                    <span>{isTyping ? '🔒 LOCKED (TYPING)' : '🔓 READY'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Focus Losses:</span>
                    <span style={{ color: diagnostics.focusLosses > 0 ? '#fbbf24' : '#34d399' }}>{diagnostics.focusLosses}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontWeight: 700, color: '#9CA3AF', marginBottom: 4 }}>INTERACTION LOCKS</div>
                <LockItem label="Typing" active={isTyping} icon={<Type size={12} />} />
                <LockItem label="Selection" active={!!selectedNodeId && !isTyping} icon={<MousePointer2 size={12} />} />
                <LockItem label="Layout Flow" active={!isTyping} icon={<Activity size={12} />} />
            </div>

            {editingInfo && (
                <div style={{ fontSize: 9, color: '#6B7280', borderTop: '1px solid #374151', paddingTop: 8 }}>
                    EDITING: {editingInfo.nodeId.slice(0, 8)}...
                </div>
            )}

            <div style={{ fontSize: 9, color: '#4B5563', textAlign: 'center' }}>
                Press ESC to force release locks
            </div>
        </div>
    );
};

const LockItem = ({ label, active, icon }: { label: string, active: boolean, icon: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: active ? '#f3f4f6' : '#4B5563' }}>
        <div style={{ color: active ? '#ef4444' : '#4B5563' }}>{icon}</div>
        <span>{label}</span>
        <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: active ? '#ef4444' : '#374151' }} />
    </div>
);
