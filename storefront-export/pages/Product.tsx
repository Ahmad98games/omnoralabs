/**
 * 🛠️ OMNORA LABS | ENTITY SPECIFICATION (PRODUCT DETAIL)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Granularity is the key to architectural precision."
 * ---------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, MessageCircle, Minus, Plus } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BuilderProvider } from '../context/BuilderContext';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import '../styles/product.css';

const KERNEL_PLACEHOLDER = '/images/placeholder_gsg.png';

interface EntityConfiguration {
    label: string;
    stock: number;
    priceOverride?: number;
}

/**
 * KERNEL_ENTITY_NODE: The foundational unit for deployment.
 */
interface KernelEntityNode {
    _id: string;
    name: string;
    price: number;
    image?: string;
    category?: string;
    description?: string;
    stock?: number;
    node_type?: string;
    deployment_zone?: string;
    isBestseller?: boolean;
    showLowStockWarning?: boolean;
    variants?: EntityConfiguration[];
}

export default function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [entity, setEntity] = useState<KernelEntityNode | null>(null);
    const [isHydrating, setIsHydrating] = useState(true);
    const [kernelContent, setKernelContent] = useState<any>(null);
    const { updateSellerStyles } = useTheme();
    const [entityFault, setEntityFault] = useState<{ message: string; code?: string } | null>(null);
    const [activationCount, setActivationCount] = useState(1);
    const [activeConfig, setActiveConfig] = useState<string>('Standard');
    const [isProcessingProtocol, setIsProcessingProtocol] = useState(false);

    /**
     * synchronizeEntityNode: Fetches specific node metadata from the persistence layer.
     */
    useEffect(() => {
        const hydroController = new AbortController();

        async function synchronizeEntityNode() {
            setIsHydrating(true);
            setEntityFault(null);
            OmnoraLogger.info(`Synchronizing entity node: ${id}`);
            
            try {
                const res = await client.get(`/products/${id}`, { signal: hydroController.signal });
                const data = res.data?.data || res.data || null;
                if (!data) throw new Error('ENTITY_NOT_FOUND');
                
                setEntity(data);
                if (data.variants?.length > 0) {
                    setActiveConfig(data.variants[0].label);
                }
                OmnoraLogger.info("Entity node synchronized successfully.");
            } catch (fault: any) {
                if (!axios.isCancel(fault)) {
                    setEntityFault({
                        message: fault.response?.data?.error || fault.message || 'Entity synchronization failed',
                        code: fault.code || (fault.response ? `OS_API_FAULT_${fault.response.status}` : 'KERNEL_NETWORK_ERROR')
                    });
                    OmnoraLogger.error("Entity Sync Fault", fault);
                }
            } finally {
                setIsHydrating(false);
            }
        }

        synchronizeEntityNode();

        async function synchronizeKernelCMS() {
            try {
                const { data } = await client.get('/cms/content');
                if (data.success && data.content) {
                    setKernelContent(data.content);
                    if (data.content.globalStyles) updateSellerStyles(data.content.globalStyles);
                }
            } catch (err) {
                OmnoraLogger.error("Kernel CMS synchronization failed", err);
            }
        }
        synchronizeKernelCMS();

        return () => hydroController.abort();
    }, [id, updateSellerStyles]);

    const stageForDeployment = () => {
        if (!entity) return;

        const manifest = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingNode = manifest.find((i: any) => i.id === entity._id && i.config === activeConfig);

        if (existingNode) {
            existingNode.quantity += activationCount;
        } else {
            manifest.push({
                id: entity._id,
                name: entity.name,
                price: entity.price,
                image: entity.image,
                quantity: activationCount,
                config: activeConfig
            });
        }

        localStorage.setItem('cart', JSON.stringify(manifest));
        window.dispatchEvent(new Event('cart-updated'));
        
        OmnoraLogger.info(`Entity [${entity._id}] staged for deployment via manifest.`);
        showToast(`${entity.name}::STAGED_FOR_DEPLOYMENT`, 'success');
    };

    const dispatchManualVerification = async () => {
        if (!entity || isProcessingProtocol) return;

        setIsProcessingProtocol(true);
        OmnoraLogger.info("Dispatching manual verification protocol...");
        
        try {
            const committalPayload = {
                items: [{
                    productId: entity._id,
                    name: entity.name,
                    price: entity.price,
                    quantity: activationCount,
                    config: activeConfig,
                    image: entity.image
                }],
                totalAmount: entity.price * activationCount,
                status: 'AWAITING_VERIFICATION'
            };

            const res = await client.post('/orders', committalPayload);
            const registryIndex = res.data?.order?.orderNumber || res.data?.order?._id || 'INQUIRY';

            const protocolMessage = `🚀 *KERNEL_DISPATCH_REQUEST* (#${registryIndex})
        
Source: ${window.location.origin}
--------------------------------
*Entity:* ${entity.name}
*Configuration:* ${activeConfig}
*Valuation:* ${(entity.price || 0).toLocaleString()} Credits
*Activation Count:* ${activationCount}
--------------------------------
*Registry Link:* ${window.location.href}

Execute manual verification for this committal intent.`;

            window.open(`https://wa.me/923097613611?text=${encodeURIComponent(protocolMessage.trim())}`, '_blank');
        } catch (fault: any) {
            OmnoraLogger.error("Manual Verification Protocol Fault", fault);
            showToast('PROTOCOL_EXECUTION_FAULT', 'error');
        } finally {
            setIsProcessingProtocol(false);
        }
    };

    if (isHydrating) return <div className="p-loading-lux" style={{ fontFamily: 'var(--font-mono)' }}>HYDRATING_ENTITY_METADATA...</div>;

    if (entityFault || !entity) return (
        <div className="product-detail-page">
            <div className="container" style={{ textAlign: 'center', padding: '10rem 0' }}>
                <h2 className="font-mono uppercase">System Fault Detected</h2>
                <p style={{ color: 'var(--royal-blue)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                    {entityFault?.message || 'ENTITY_RESOLUTION_FAIL'}
                </p>
                <button onClick={() => navigate('/collection')} className="btn-luxury-outline" style={{ fontFamily: 'var(--font-mono)' }}>
                    RETURN_TO_REGISTRY
                </button>
            </div>
        </div>
    );

    const isNodeOffline = (entity.variants?.length ?? 0) > 0
        ? (entity.variants?.find(v => v.label === activeConfig)?.stock ?? 0) === 0
        : (entity.stock ?? 0) === 0;

    const currentLatency = (entity.variants?.length ?? 0) > 0
        ? (entity.variants?.find(v => v.label === activeConfig)?.stock ?? 0)
        : (entity.stock ?? 0);

    const isPreview = window.location.search.includes('preview=true');

    return (
        <BuilderProvider initialData={kernelContent || {}} isPreview={isPreview}>
            <div className="product-detail-page scroll-reveal">
                <div className="container">
                    <Link to="/collection" className="back-link-lux" style={{ fontFamily: 'var(--font-mono)' }}>
                        <ArrowLeft size={16} /> RETURN_TO_REGISTRY
                    </Link>

                    <div className="product-container">
                        {/* Technical Visualization (Gallery) */}
                        <div className="product-gallery">
                            <div className="main-image-box">
                                <img src={entity.image || KERNEL_PLACEHOLDER} alt={entity.name} />
                                {entity.isBestseller && <div className="bestseller-badge" style={{ fontFamily: 'var(--font-mono)' }}>TOP_TIER</div>}
                            </div>
                        </div>

                        {/* Node Metadata (Info) */}
                        <div className="product-info-stack">
                            <span className="p-brand-lux" style={{ fontFamily: 'var(--font-mono)' }}>OMNORA_LABS::FOUNDRY</span>
                            <h1 className="p-name-lux serif">{entity.name}</h1>
                            <div className="p-price-lux" style={{ fontFamily: 'var(--font-mono)' }}>
                                {(entity.price || 0).toLocaleString()} Credits
                            </div>

                            <p className="p-desc-lux">{entity.description}</p>

                            {/* Configuration Matrix */}
                            {(entity.variants?.length ?? 0) > 0 && (
                                <div className="selection-group">
                                    <span className="group-label" style={{ fontFamily: 'var(--font-mono)' }}>SELECT_NODE_VARIANT</span>
                                    <div className="size-grid">
                                        {entity.variants?.map(v => (
                                            <button
                                                key={v.label}
                                                className={`size-option ${activeConfig === v.label ? 'active' : ''}`}
                                                onClick={() => setActiveConfig(v.label)}
                                                style={{ fontFamily: 'var(--font-mono)' }}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Integrity Alerts */}
                            {entity.showLowStockWarning && currentLatency > 0 && currentLatency < 5 && (
                                <div className="stock-pulse" style={{ fontFamily: 'var(--font-mono)' }}>
                                    <span className="pulse-dot"></span>
                                    SYSTEM_ALERT: CRITICAL_LATENCY_{currentLatency}_REMAINING
                                </div>
                            )}

                            {isNodeOffline && (
                                <div className="sold-out-notice" style={{ fontFamily: 'var(--font-mono)' }}>NODE_OFFLINE</div>
                            )}

                            {/* Activation Parameters */}
                            {!isNodeOffline && (
                             <div className="selection-group" style={{ marginTop: '2rem' }}>
                                <span className="group-label" style={{ fontFamily: 'var(--font-mono)' }}>ACTIVATION_COUNT</span>
                                <div className="qty-control" style={{ fontFamily: 'var(--font-mono)' }}>
                                    <button 
                                        aria-label="Decrease activation count"
                                        onClick={() => setActivationCount(Math.max(1, activationCount - 1))}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span>{activationCount}</span>
                                    <button 
                                        aria-label="Increase activation count"
                                        onClick={() => setActivationCount(activationCount + 1)}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            )}

                            {/* Protocol Actions */}
                            <div className="p-actions-lux">
                                {!isNodeOffline && (
                                    <>
                                        <button className="btn-luxury-action" onClick={stageForDeployment} style={{ fontFamily: 'var(--font-mono)' }}>
                                            <ShoppingBag size={18} /> STAGE_FOR_DEPLOYMENT
                                        </button>
                                        <button className="btn-luxury-outline" onClick={dispatchManualVerification} style={{ fontFamily: 'var(--font-mono)' }}>
                                            <MessageCircle size={18} /> DISPATCH_VERIFICATION
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Integrity Indicators */}
                            <div className="trust-indicators">
                                <div className="trust-card">
                                    <Truck size={20} />
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>Global_Propagation::3-5_Cycles</span>
                                </div>
                                <div className="trust-card">
                                    <ShieldCheck size={20} />
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>Kernel_Integrity::Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BuilderProvider>
    );
}
