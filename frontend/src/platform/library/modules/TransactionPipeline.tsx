import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { useOmnora } from '../../client/OmnoraContext';
import { EditableText } from '../EditableComponents';

/**
 * OmnoraCartDrawer: Luxury slide-out cart.
 */
export const OmnoraCartDrawer: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes, mode } = useOmnora();
    const node = nodes[nodeId];
    const [isOpen, setIsOpen] = useState(mode === 'edit'); // Open by default in edit mode for visibility

    if (!node) return null;

    const items = [
        { id: '1', name: 'Signature v1', price: 1250, qty: 1, img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100' },
        { id: '2', name: 'Velvet Noir', price: 2500, qty: 1, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100' }
    ];

    const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);

    const drawerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '400px',
        background: node.styles?.background || '#0a0a0b',
        borderLeft: '1px solid #1a1a1b',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: `transform ${node.motion?.duration || 400}ms ${node.motion?.curve || 'cubic-bezier(0.16, 1, 0.3, 1)'}`,
        ...node.styles
    };

    return (
        <>
            {mode === 'preview' && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ position: 'fixed', bottom: '40px', right: '40px', background: 'var(--accent-primary)', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', zIndex: 9999 }}
                >
                    <ShoppingBag size={24} color="#000" />
                </button>
            )}

            <div className="omnora-cart-drawer" style={drawerStyle}>
                <div style={{ padding: '30px', borderBottom: '1px solid #1a1a1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.1em' }}>
                        CART (<EditableText nodeId={nodeId} path="props.itemCountLabel" tag="span" />)
                    </div>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                    {items.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <img src={item.img} style={{ width: '80px', height: '100px', objectFit: 'cover' }} alt="" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: 900, marginBottom: '4px' }}>{item.name}</div>
                                <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '12px' }}>${item.price.toLocaleString()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ border: '1px solid #1a1a1b', display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px' }}>
                                        <Plus size={10} /> <span>{item.qty}</span> <Minus size={10} />
                                    </div>
                                    <span style={{ fontSize: '9px', fontWeight: 900, opacity: 0.3 }}>REMOVE</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '30px', borderTop: '1px solid #1a1a1b', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
                        <span style={{ opacity: 0.5 }}>SUBTOTAL</span>
                        <span style={{ fontWeight: 900 }}>${subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '10px', opacity: 0.5 }}>
                        <span>TAXES & SHIPPING</span>
                        <span>CALCULATED AT CHECKOUT</span>
                    </div>
                    <button style={{
                        width: '100%', padding: '20px', background: 'var(--accent-primary)', color: '#000', border: 'none', fontWeight: 900, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer'
                    }}>
                        <EditableText nodeId={nodeId} path="props.checkoutLabel" tag="span" />
                    </button>
                </div>
            </div>
        </>
    );
};

/**
 * OmnoraBuyNowButton: Industrial luxury action button.
 */
export const OmnoraBuyNowButton: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const [isActive, setIsActive] = useState(false);
    const node = nodes[nodeId];

    if (!node) return null;

    const isHoveredForced = node.forcedState === 'hover';
    const isActiveForced = node.forcedState === 'active';

    const finalStyle: React.CSSProperties = {
        width: '100%',
        padding: '18px',
        background: node.styles?.background || '#fff',
        color: node.styles?.color || '#000',
        border: 'none',
        fontWeight: 900,
        fontSize: '11px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: (isActive || isActiveForced) ? 'scale(0.98)' : 'scale(1)',
        opacity: (isHoveredForced) ? 0.9 : 1,
        cursor: 'pointer',
        ...node.styles,
        ...((isActive || isActiveForced) ? node.interactions?.active : {})
    };

    return (
        <button
            style={finalStyle}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
        >
            <EditableText nodeId={nodeId} path="props.label" tag="span" />
        </button>
    );
};
