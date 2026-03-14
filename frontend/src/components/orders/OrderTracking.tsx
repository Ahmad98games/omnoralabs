import React from 'react';
import { CheckCircle2, Circle, Clock, Package, Truck, AlertCircle } from 'lucide-react';
import './OrderTracking.css';

interface AuditEntry {
    statusChange: string;
    actorName: string;
    timestamp: string;
    note?: string;
}

interface OrderTrackingProps {
    status: string;
    auditTrail: AuditEntry[];
}

const statusMap: Record<string, { icon: any, color: string }> = {
    'pending': { icon: Clock, color: '#ffd600' },
    'processing': { icon: Package, color: '#00f0ff' },
    'shipped': { icon: Truck, color: '#3b82f6' },
    'delivered': { icon: CheckCircle2, color: '#22c55e' },
    'cancelled': { icon: AlertCircle, color: '#ef4444' }
};

export default function OrderTracking({ status, auditTrail }: OrderTrackingProps) {
    const currentStatus = statusMap[status.toLowerCase()] || { icon: Circle, color: '#ccc' };

    return (
        <div className="order-tracking-panel">
            <div className="status-header" style={{ borderLeftColor: currentStatus.color }}>
                <currentStatus.icon size={24} style={{ color: currentStatus.color }} />
                <div className="status-info">
                    <span className="eyebrow">CURRENT STATUS</span>
                    <h3>{status.toUpperCase()}</h3>
                </div>
            </div>

            <div className="audit-timeline">
                <span className="eyebrow">AUDIT TRAIL / LOGISTICS HISTORY</span>
                <div className="timeline-items">
                    {auditTrail.length > 0 ? auditTrail.map((entry, idx) => (
                        <div key={idx} className="timeline-item">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <div className="timeline-top">
                                    <span className="timeline-status">{entry.statusChange.toUpperCase()}</span>
                                    <span className="timeline-time">{new Date(entry.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="timeline-actor">Processor: {entry.actorName}</p>
                                {entry.note && <p className="timeline-note italic">"{entry.note}"</p>}
                            </div>
                        </div>
                    )).reverse() : (
                        <div className="timeline-placeholder">No audit records found. Status initialized.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
