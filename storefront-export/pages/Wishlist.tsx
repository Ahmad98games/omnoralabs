/**
 * 🛠️ OMNORA LABS | REGISTRY BUFFER (WISHLIST MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Selection is the precursor to systemic integration."
 * ---------------------------------------------------------
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Heart, ShoppingBag, X, ArrowRight, Loader2, Database, ShieldAlert, Cpu } from 'lucide-react';
import SmartImage from '../components/SmartImage';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import { FALLBACK_IMAGE } from '../constants';
import './Wishlist.css';

type BufferedEntity = {
    _id: string;
    name: string;
    price: number;
    image: string;
    inStock: boolean;
    category: string;
};

export default function Wishlist() {
    const [bufferedEntities, setBufferedEntities] = useState<BufferedEntity[]>([]);
    const [isSynchronizing, setIsSynchronizing] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        synchronizeBufferState();
    }, []);

    const synchronizeBufferState = async () => {
        try {
            OmnoraLogger.info("Initiating Registry Buffer synchronization...");
            const persistedBuffer = JSON.parse(localStorage.getItem('wishlist') || '[]');

            setTimeout(() => {
                setBufferedEntities(persistedBuffer);
                setIsSynchronizing(false);
                OmnoraLogger.info(`Buffer synchronization complete. ${persistedBuffer.length} entities identified.`);
            }, 600);

        } catch (fault) {
            OmnoraLogger.error("Registry Buffer synchronization fault", fault);
            setIsSynchronizing(false);
        }
    };

    const decommissionFromBuffer = (entityId: string, name: string) => {
        const nextBuffer = bufferedEntities.filter(e => e._id !== entityId);
        setBufferedEntities(nextBuffer);
        localStorage.setItem('wishlist', JSON.stringify(nextBuffer));
        showToast('ENTITY_DECOMMISSIONED_FROM_BUFFER', 'info');
        OmnoraLogger.info(`Entity [${name}] decommissioned from buffer.`);
    };

    const stageForDeployment = (entity: BufferedEntity) => {
        const deploymentManifest = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingNode = deploymentManifest.find((i: any) => i.id === entity._id);

        if (existingNode) {
            existingNode.quantity++;
        } else {
            deploymentManifest.push({
                id: entity._id,
                name: entity.name,
                price: entity.price,
                image: entity.image,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(deploymentManifest));
        window.dispatchEvent(new Event('cart-updated'));
        showToast(`${entity.name}_STAGED_FOR_DEPLOYMENT`, 'success');
        OmnoraLogger.info(`Entity [${entity.name}] staged for deployment.`);
    };

    if (isSynchronizing) {
        return (
            <div className="wishlist-luxury">
                <div className="loading-luxury">
                    <Loader2 size={32} className="animate-spin text-royal" />
                    <p className="font-mono xsmall uppercase italic">Synchronizing_Registry_Buffer...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-luxury reveal">
            <div className="luxury-hero-small">
                <div className="container">
                    <header className="wishlist-header-lux">
                        <span className="eyebrow font-mono" style={{ letterSpacing: '2px' }}>DATA_SELECTION_ISOLATION</span>
                        <h1 className="subtitle-serif">REGISTRY_BUFFER</h1>
                        <p className="description-small italic" style={{ fontFamily: 'var(--font-mono)' }}>
                            {bufferedEntities.length} ACTIVE_BUFFER_NODES • {bufferedEntities.reduce((s, e) => s + e.price, 0).toLocaleString()} VALUATION
                        </p>
                    </header>
                </div>
            </div>

            <div className="container">
                {bufferedEntities.length === 0 ? (
                    <div className="empty-state-luxury">
                        <Database size={64} strokeWidth={1} className="text-royal mb-4 animate-pulse" />
                        <h2 className="font-mono uppercase">BUFFER_EMPTY</h2>
                        <p className="text-muted">No entities currently cached in the primary selection buffer.</p>
                        <Link to="/collection" className="btn-luxury-outline mt-4 font-mono xsmall">
                            ACCESS_MAIN_REGISTRY
                        </Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {bufferedEntities.map((entity) => (
                            <div key={entity._id} className="wishlist-card animate-fade-in-up">
                                <div className="card-image-box">
                                    <Link to={`/product/${entity._id}`}>
                                        <SmartImage
                                            src={entity.image || FALLBACK_IMAGE}
                                            alt={entity.name}
                                            aspectRatio="1/1"
                                            className="wishlist-img"
                                        />
                                    </Link>
                                    <button
                                        className="btn-remove"
                                        onClick={() => decommissionFromBuffer(entity._id, entity.name)}
                                        title="DECOMMISSION"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="card-details">
                                    <Link to={`/product/${entity._id}`} className="product-link">
                                        <h3 className="product-title font-mono xsmall uppercase" style={{ fontWeight: 600 }}>{entity.name}</h3>
                                    </Link>
                                    <p className="product-price font-mono">{entity.price.toLocaleString()} Credits</p>

                                    <div className="card-actions-lux">
                                        {entity.inStock !== false ? (
                                            <button
                                                className="btn-lux-bag font-mono xsmall"
                                                onClick={() => stageForDeployment(entity)}
                                            >
                                                STAGE_FOR_DEPLOYMENT <Cpu size={14} />
                                            </button>
                                        ) : (
                                            <button className="btn-lux-disabled font-mono xsmall" disabled>
                                                REGISTRY_NODE_OFFLINE
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="container" style={{ marginTop: '4rem', opacity: 0.5 }}>
                <div className="security-notice" style={{ justifyContent: 'center' }}>
                    <ShieldAlert size={14} />
                    <span className="font-mono xsmall">LOCAL_PERSISTENCE_BUFFER_ENCRYPTED</span>
                </div>
            </div>
        </div>
    );
}