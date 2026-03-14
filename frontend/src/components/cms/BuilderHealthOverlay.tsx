import React, { useMemo } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { getRegistryEntry } from './BuilderRegistry';
import { Activity, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuilderNode } from '../../context/BuilderContext';

export const BuilderHealthOverlay: React.FC = () => {
    const { nodeTree, viewport, diagnostics, pages, systemHealth } = useBuilder();

    // Compute health metrics
    const stats = useMemo(() => {
        const nodes = Object.values(nodeTree) as BuilderNode[];
        const total = nodes.length;
        let registered = 0;
        let missing = 0;
        let hydrations = 0;
        let brokenLinks = 0;

        const healthMap = nodes.map(node => {
            const entry = getRegistryEntry(node.type);
            const isRegistered = !!entry;
            if (isRegistered) registered++;
            else missing++;

            const propCount = Object.keys(node.props || {}).length;
            if (propCount > 0) hydrations++;

            const nodeLinks = (node.props as any).links || {};
            let hasBrokenLink = false;
            Object.values(nodeLinks).forEach((lnk: any) => {
                if (lnk.type === 'page' && lnk.pageId && !pages.byId[lnk.pageId]) {
                    brokenLinks++;
                    hasBrokenLink = true;
                }
            });

            return {
                id: node.id,
                type: node.type,
                status: isRegistered ? (hasBrokenLink ? 'warning' : 'healthy') : 'missing',
                props: propCount,
                hasBrokenLink
            };
        });

        return { total, registered, missing, hydrations, healthMap, brokenLinks };
    }, [nodeTree, pages]);

    if (!diagnostics.showPanel) return null;

    const invariants = systemHealth?.invariants || { cycles: [], orphans: [], deadReferences: [] };
    const isIntegrityStable = invariants.cycles.length === 0 && invariants.deadReferences.length === 0;
    const isHealthy = stats.missing === 0 && stats.brokenLinks === 0 && isIntegrityStable;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            background: 'rgba(10, 10, 15, 0.98)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
            color: '#fff',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'monospace'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isHealthy ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} color={isHealthy ? '#10b981' : '#ef4444'} />
                    <span style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.1em' }}>OS.DIAGNOSTICS_v5</span>
                </div>
                <div style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    color: isHealthy ? '#10b981' : '#ef4444',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {systemHealth?.status || 'UNKNOWN'}
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <MetricCard
                    icon={<ShieldAlert size={12} color={stats.missing > 0 ? '#ef4444' : '#444'} />}
                    label="MISSING_TYPES"
                    value={stats.missing}
                    critical={stats.missing > 0}
                />
                <MetricCard
                    icon={<Link size={12} color={stats.brokenLinks > 0 ? '#f59e0b' : '#444'} />}
                    label="BROKEN_LINKS"
                    value={stats.brokenLinks}
                    critical={stats.brokenLinks > 0}
                />
                <MetricCard
                    icon={<AlertTriangle size={12} color={invariants.cycles.length > 0 ? '#ef4444' : '#444'} />}
                    label="NODE_CYCLES"
                    value={invariants.cycles.length}
                    critical={invariants.cycles.length > 0}
                />
                <MetricCard
                    icon={<ShieldAlert size={12} color={invariants.orphans.length > 0 ? '#f59e0b' : '#444'} />}
                    label="ORPHAN_NODES"
                    value={invariants.orphans.length}
                    critical={invariants.orphans.length > 0}
                />
            </div>

            {/* Structural Trace */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <div style={{ fontSize: '9px', color: '#4b5563', fontWeight: 700, margin: '12px 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Node_Structural_Trace
                </div>
                {stats.healthMap.map(item => (
                    <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '4px',
                        marginBottom: '2px',
                        fontSize: '10px',
                        opacity: item.status === 'healthy' ? 0.6 : 1,
                        borderLeft: item.status === 'healthy' ? '2px solid transparent' : `2px solid ${item.status === 'missing' ? '#ef4444' : '#f59e0b'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: item.status === 'missing' ? '#ef4444' : '#e2e8f0' }}>
                                {item.type}
                            </span>
                        </div>
                        <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'monospace' }}>{item.id.split('_').pop()}</span>
                    </div>
                ))}
            </div>

            {/* Forensic Alerts */}
            <AnimatePresence>
                {stats.missing > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ background: '#ef4444', color: '#fff', padding: '8px 16px', fontSize: '10px', fontWeight: 700 }}
                    >
                        ERR: UNREGISTERED_COMPONENT_DETECTED ({stats.missing})
                    </motion.div>
                )}
                {stats.brokenLinks > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ background: '#f59e0b', color: '#000', padding: '8px 16px', fontSize: '10px', fontWeight: 700 }}
                    >
                        WARN: BROKEN_INTERNAL_LINK ({stats.brokenLinks})
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: any, total?: number, critical?: boolean }> = ({ icon, label, value, total, critical }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '10px',
        borderRadius: '10px',
        border: critical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {icon}
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>{label}</span>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 900 }}>
            {value}{total !== undefined && <span style={{ fontSize: '10px', opacity: 0.4 }}> / {total}</span>}
        </div>
    </div>
);
