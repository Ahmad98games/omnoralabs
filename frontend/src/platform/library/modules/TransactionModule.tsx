import React from 'react';
import { useOmnora } from '../../client/OmnoraContext';
import { ShoppingBag, CreditCard, ShieldCheck, Percent } from 'lucide-react';

export const TransactionModule: React.FC = () => {
    const { selectedNodeId, nodes, updateNode, commitHistory } = useOmnora();
    const node = selectedNodeId ? nodes[selectedNodeId] : null;

    if (!node || !['cart', 'checkout'].includes(node.type)) return null;

    const updateProp = (key: string, value: any) => {
        updateNode?.(node.id, `props.${key}`, value);
    };

    return (
        <div className="module-container">
            {/* Cart Behavior */}
            {node.type === 'cart' && (
                <div className="module-section" style={{ marginBottom: '2rem' }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                        <ShoppingBag size={12} /> CART EXPERIENCE
                    </span>

                    <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CART TYPE</span>
                        <select
                            value={node.props.cartType || 'drawer'}
                            onChange={(e) => updateProp('cartType', e.target.value)}
                            onBlur={commitHistory}
                            style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '8px', fontSize: '11px' }}
                        >
                            <option value="drawer">SLIDE-OUT DRAWER</option>
                            <option value="page">DEDICATED PAGE</option>
                            <option value="modal">CENTER MODAL</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '11px' }}>FREE SHIPPING ESTIMATOR</span>
                        <button
                            onClick={() => updateProp('showShippingEstimator', !node.props.showShippingEstimator)}
                            style={{
                                width: '32px',
                                height: '16px',
                                borderRadius: '10px',
                                background: node.props.showShippingEstimator ? 'var(--accent-primary)' : '#333',
                                position: 'relative',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: node.props.showShippingEstimator ? '18px' : '2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#fff',
                                transition: 'left 0.2s'
                            }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Checkout Flow */}
            {node.type === 'checkout' && (
                <div className="module-section" style={{ marginBottom: '2rem' }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                        <CreditCard size={12} /> CHECKOUT OPTIMIZATION
                    </span>

                    <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CHECKOUT STYLE</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['single_page', 'multi_step'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => updateProp('checkoutStyle', style)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        background: node.props.checkoutStyle === style ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${node.props.checkoutStyle === style ? 'var(--accent-primary)' : '#333'}`,
                                        color: node.props.checkoutStyle === style ? 'var(--accent-primary)' : '#fff',
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        borderRadius: '4px',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {style.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={10} color="var(--accent-primary)" />
                            <span style={{ fontSize: '11px' }}>GUEST CHECKOUT</span>
                        </div>
                        <button
                            onClick={() => updateProp('allowGuest', !node.props.allowGuest)}
                            style={{
                                width: '32px',
                                height: '16px',
                                borderRadius: '10px',
                                background: node.props.allowGuest ? 'var(--accent-primary)' : '#333',
                                position: 'relative',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: node.props.allowGuest ? '18px' : '2px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#fff',
                                transition: 'left 0.2s'
                            }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Shipping & Promo */}
            <div className="module-section">
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                    <Percent size={12} /> CONVERSION TOOLS
                </span>
                <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>PROMO ENGINE</span>
                    <select
                        value={node.props.promoStyle || 'classic'}
                        onChange={(e) => updateProp('promoStyle', e.target.value)}
                        onBlur={commitHistory}
                        style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '8px', fontSize: '11px' }}
                    >
                        <option value="classic">CLASSIC COUPON FIELD</option>
                        <option value="floating">FLOATING PROMO SELECTOR</option>
                        <option value="automatic">AUTO-APPLY BEST DISCOUNT</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
