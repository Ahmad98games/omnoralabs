/**
 * 🛠️ OMNORA LABS | COMMITTAL VALIDATION (ORDER CONFIRMATION)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Finality is the peak of industrial integrity."
 * ---------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import client from '../api/client';
import { openWhatsApp } from '../utils/whatsappOrderService';
import {
    CheckCircle,
    MessageCircle,
    Copy,
    ArrowLeft,
    Loader2,
    ShieldCheck,
    Smartphone
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import './OrderConfirmation.css';

/**
 * COMMITTAL_RECORD: High-integrity snapshot of a successful transaction.
 */
interface CommittalRecord {
    _id: string;
    orderNumber?: string;
    totalAmount?: number;
    total?: number;
    paymentMethod: string;
    items?: any[];
}

export default function OrderConfirmation() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { showToast } = useToast();

    const [record, setRecord] = useState<CommittalRecord | null>(location.state?.order || null);
    const [isAwaitingIndex, setIsAwaitingIndex] = useState(!location.state?.order);

    /**
     * retrieveCommittalRegistry: Synchronizes the local state with the persistence layer.
     */
    useEffect(() => {
        if (record) return;

        const retrieveCommittalRegistry = async () => {
            try {
                if (!id) return;
                OmnoraLogger.info(`Retrieving committal record for index: ${id}`);
                
                const res = await client.get(`/orders/${id}`);
                if (res.data.success) {
                    setRecord(res.data.order);
                    OmnoraLogger.info("Committal record synchronized successfully.");
                }
            } catch (fault: any) {
                OmnoraLogger.error("Committal retrieval fault", fault);
            } finally {
                setIsAwaitingIndex(false);
            }
        };
        retrieveCommittalRegistry();
    }, [id, record]);

    const handleWhatsAppDispatch = () => {
        if (record) {
            const registryPayload = {
                ...record,
                orderNumber: record.orderNumber || record._id,
                total: record.totalAmount || record.total || 0
            };

            OmnoraLogger.info("Dispatching manual protocol verification via Concierge...");
            openWhatsApp(registryPayload as any, 'automation');
        } else if (id) {
            const fallbackProtocol = `https://wa.me/923097613611?text=${encodeURIComponent(`[KERNEL_DISPATCH] Order Reference #${id}. Awaiting manual verification.`)}`;
            window.open(fallbackProtocol, '_blank');
        }
    };

    const copyRegistryHandle = () => {
        const targetHandle = record?.orderNumber || id || '';
        navigator.clipboard.writeText(targetHandle);
        showToast('REGISTRY_HANDLE_COPIED', 'success');
    };

    if (isAwaitingIndex) {
        return (
            <div className="confirmation-luxury">
                <div className="loading-luxury">
                    <Loader2 size={32} className="animate-spin text-royal" />
                    <p className="font-mono italic text-muted">AWAITING_REGISTRY_SYNC...</p>
                </div>
            </div>
        );
    }

    const registryIndex = record?.orderNumber || id || 'UNKNOWN_INDEX';
    const aggregateValue = record?.totalAmount || record?.total || 0;

    return (
        <div className="confirmation-luxury reveal">
            <div className="confirmation-card-luxury animate-scale-up">

                {/* INTEGRITY HEADER */}
                <div className="success-header-lux">
                    <div className="icon-pulse-wrapper">
                        <div className="icon-pulse-ring-gold"></div>
                        <div className="success-icon-gold">
                            <CheckCircle size={40} strokeWidth={1} />
                        </div>
                    </div>
                    <h1 className="subtitle-serif">COMMITTAL_AUTHORIZED</h1>
                    <p className="success-sub-lux italic">
                        Omnora Protocol successfully executed. <br />
                        Your system entities are being provisioned.
                    </p>
                </div>

                {/* REGISTRY DATA GRID */}
                <div className="details-grid-luxury">
                    <div className="detail-row-lux">
                        <span className="detail-label-lux" style={{ fontFamily: 'var(--font-mono)' }}>REGISTRY_REFERENCE</span>
                        <div className="detail-value-lux" onClick={copyRegistryHandle} style={{ fontFamily: 'var(--font-mono)' }}>
                            <span>#{registryIndex}</span>
                            <Copy size={12} className="copy-icon-lux" />
                        </div>
                    </div>
                    <div className="detail-row-lux">
                        <span className="detail-label-lux" style={{ fontFamily: 'var(--font-mono)' }}>AGGREGATE_VALUE</span>
                        <span className="detail-value-lux text-royal" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {aggregateValue.toLocaleString()} Credits
                        </span>
                    </div>
                </div>

                {/* PROTOCOL DISPATCH */}
                <div className="whatsapp-section-luxury">
                    <div className="wa-header-lux">
                        <h3 className="font-mono uppercase xsmall">Manual Protocol Verification</h3>
                        <span className="badge-luxury">OPTIMIZED</span>
                    </div>
                    <p className="wa-desc-lux">
                        To prioritize kernel provisioning and receive instant propagation updates, execute manual verification via the Concierge Node.
                    </p>

                    <button onClick={handleWhatsAppDispatch} className="btn-luxury-wa" style={{ fontFamily: 'var(--font-mono)' }}>
                        <MessageCircle size={18} />
                        <span>DISPATCH_VERIFICATION</span>
                    </button>
                </div>

                {/* SETTLEMENT INSTRUCTIONS */}
                {record?.paymentMethod !== 'COD' && (
                    <div className="payment-instructions-lux animate-reveal-slow">
                        <div className="wa-header-lux">
                            <Smartphone size={16} className="text-royal" />
                            <h3 className="font-mono uppercase xsmall">Settlement Protocol</h3>
                        </div>
                        <div className="instruction-box">
                            <div className="instruction-item">
                                <span className="inst-label" style={{ fontFamily: 'var(--font-mono)' }}>EASYPAISA / JAZZCASH</span>
                                <span className="inst-value" style={{ fontFamily: 'var(--font-mono)' }}>0309 7613611</span>
                                <span className="inst-sub">Node Title: Hamza Bilal</span>
                            </div>
                            <p className="inst-note">
                                Please dispatch the settlement manifest (screenshot) via the verified Concierge link for final committal.
                            </p>
                        </div>
                    </div>
                )}

                {/* SYSTEM INTEGRITY BANNER */}
                <div className="security-notice">
                    <ShieldCheck size={16} />
                    <span style={{ fontFamily: 'var(--font-mono)' }}>KERNEL_LEVEL_ENCRYPTION_ACTIVE</span>
                </div>

                {/* KERNEL RETURN */}
                <Link to="/" className="back-link-luxury" style={{ fontFamily: 'var(--font-mono)' }}>
                    <ArrowLeft size={16} /> RETURN_TO_ROOT
                </Link>

            </div>
        </div>
    );
}