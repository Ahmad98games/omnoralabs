/**
 * 🛠️ OMNORA LABS | DEPLOYMENT MANIFEST (CART MODULE)
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Rendering Engine
 * "Staging is the final gate before systemic committal."
 * ---------------------------------------------------------
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Cpu } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useToast } from '../context/ToastContext';
import { OmnoraLogger } from '../utils/OmnoraLogger';
import { FALLBACK_IMAGE } from '../constants';
import './Cart.css';

/**
 * MANIFEST_ENTITY: A staged unit awaiting committal.
 */
type ManifestEntity = { 
    id: string; 
    name: string; 
    price: number; 
    image?: string; 
    quantity: number;
    config?: string;
};

export default function Cart() {
    const [entities, setEntities] = useState<ManifestEntity[]>([]);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const contentRef = useScrollReveal();

    /**
     * synchronizeManifest: Aligns the local state with the persistence layer.
     */
    useEffect(() => {
        const storedManifest = JSON.parse(localStorage.getItem('cart') || '[]') as ManifestEntity[];
        setEntities(storedManifest);
        OmnoraLogger.info(`Manifest synchronized: ${storedManifest.length} entities identified.`);
    }, []);

    const updateManifestRegistry = (updatedEntities: ManifestEntity[]) => {
        setEntities(updatedEntities);
        localStorage.setItem('cart', JSON.stringify(updatedEntities));
        window.dispatchEvent(new Event('cart-updated'));
        OmnoraLogger.info("Manifest registry updated.");
    };

    const decommissionEntity = (id: string, name: string) => {
        if (confirm(`DECOMMISSION ["${name}"] FROM MANIFEST?`)) {
            const nextEntities = entities.filter(e => e.id !== id);
            updateManifestRegistry(nextEntities);
            showToast('ENTITY_DECOMMISSIONED', 'info');
        }
    };

    const adjustActivationCount = (id: string, delta: number) => {
        const updatedEntities = entities.map(e => {
            if (e.id === id) {
                const nextCount = Math.max(1, e.quantity + delta);
                return { ...e, quantity: nextCount };
            }
            return e;
        });
        updateManifestRegistry(updatedEntities);
    };

    const purgeManifest = () => {
        if (confirm('EXECUTE COMPLETE MANIFEST PURGE? THIS ACTION IS IRREVERSIBLE.')) {
            updateManifestRegistry([]);
            OmnoraLogger.info("Manifest purged successfully.");
            showToast('MANIFEST_PURGED', 'info');
        }
    };

    const aggregateValuation = useMemo(() => 
        entities.reduce((total, e) => total + e.price * e.quantity, 0), [entities]
    );

    const totalActivationNodes = useMemo(() => 
        entities.reduce((sum, e) => sum + e.quantity, 0), [entities]
    );

    const handleRegistryImageFault = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = FALLBACK_IMAGE;
        e.currentTarget.onerror = null;
    };

    if (entities.length === 0) {
        return (
            <div className="cart-page empty-cart animate-fade-in">
                <div className="empty-cart-content">
                    <Cpu size={48} className="text-royal mb-4 animate-pulse" />
                    <h2 className="font-mono uppercase">MANIFEST_VACANT</h2>
                    <p className="text-muted italic">Registry index contains no active entities for deployment.</p>
                    <Link to="/collection" className="luxury-button hover-lift" style={{ fontFamily: 'var(--font-mono)' }}>
                        RETURN_TO_REGISTRY
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-luxury">
            <header className="cart-hero-mini">
                <div className="container">
                    <span className="eyebrow" style={{ fontFamily: 'var(--font-mono)' }}>STAGING_AREA</span>
                    <h1 className="h1 subtitle-serif">DEPLOYMENT_MANIFEST</h1>
                    <p className="text-muted italic" style={{ fontFamily: 'var(--font-mono)' }}>
                        {totalActivationNodes} ACTIVE_NODES • {aggregateValuation.toLocaleString()} CREDITS
                    </p>
                </div>
            </header>

            <div className="cart-container" ref={contentRef}>
                <div className="cart-content">
                    <div className="cart-items">
                        <div className="cart-header" style={{ fontFamily: 'var(--font-mono)' }}>
                            <span>ENTITY_HANDLE</span>
                            <span>ACTIVATION_COUNT</span>
                            <span>VALUATION</span>
                        </div>

                        {entities.map((entity, index) => (
                            <div
                                key={entity.id}
                                className="cart-item animate-slide-in-right"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="item-info">
                                    <div className="item-image-placeholder">
                                        <img
                                            src={entity.image || FALLBACK_IMAGE}
                                            alt={entity.name}
                                            onError={handleRegistryImageFault}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-mono xsmall uppercase" style={{ fontWeight: 600 }}>{entity.name}</h3>
                                        <p className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                                            {entity.price.toLocaleString()} Credits
                                        </p>
                                        <button
                                            onClick={() => decommissionEntity(entity.id, entity.name)}
                                            className="remove-btn"
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                        >
                                            DECOMMISSION
                                        </button>
                                    </div>
                                </div>

                                <div className="item-quantity">
                                    <button
                                        onClick={() => adjustActivationCount(entity.id, -1)}
                                        disabled={entity.quantity <= 1}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="font-mono">{entity.quantity}</span>
                                    <button onClick={() => adjustActivationCount(entity.id, 1)}>
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="item-total font-mono" style={{ fontWeight: 600 }}>
                                    {(entity.price * entity.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={purgeManifest}
                            className="clear-cart-btn hover-scale"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            PURGE_MANIFEST
                        </button>
                    </div>

                    <div className="order-summary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="font-mono uppercase xsmall" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            Committal Summary
                        </h2>

                        <div className="summary-row" style={{ fontFamily: 'var(--font-mono)' }}>
                            <span>Active Nodes ({totalActivationNodes})</span>
                            <span>{aggregateValuation.toLocaleString()} CR</span>
                        </div>

                        <div className="summary-row" style={{ fontFamily: 'var(--font-mono)' }}>
                            <span>Sub-Aggregate</span>
                            <span>{aggregateValuation.toLocaleString()} CR</span>
                        </div>

                        <p className="shipping-note italic">
                            System propagation, settlement overheads, and protocol overrides applied at committal.
                        </p>

                        <div className="summary-total" style={{ fontFamily: 'var(--font-mono)', borderTop: '2px solid var(--royal-blue)' }}>
                            <span>TOTAL_VALUATION</span>
                            <span>{aggregateValuation.toLocaleString()} Credits</span>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="luxury-button checkout-btn hover-lift"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            INITIATE_COMMITTAL
                        </button>

                        <div className="continue-shopping">
                            <Link to="/collection" className="continue-link" style={{ fontFamily: 'var(--font-mono)' }}>
                                ← RETURN_TO_REGISTRY
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '2rem' }}>
                <div className="security-notice" style={{ justifyContent: 'center', opacity: 0.6 }}>
                    <ShieldCheck size={16} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>ENCRYPTED_MANIFEST_BUFFER_ACTIVE</span>
                </div>
            </div>
        </div>
    );
}
)

}