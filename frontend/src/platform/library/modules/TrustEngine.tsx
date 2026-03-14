import React from 'react';
import { Shield, CreditCard, Truck, RefreshCw, Smartphone } from 'lucide-react';
import { useOmnora } from '../../client/OmnoraContext';
import { EditableText } from '../EditableComponents';

/**
 * OmnoraTrustSeals: Row of dynamic security/payment badges.
 */
export const OmnoraTrustSeals: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const node = nodes[nodeId];

    if (!node) return null;

    const fill = node.props?.badgeColor || '#555';
    const opacity = node.props?.badgeOpacity || 0.6;

    const badges = [
        { icon: Shield, label: 'SSL SECURE' },
        { icon: CreditCard, label: 'STRIPE' },
        { icon: Smartphone, label: 'APPLE PAY' }
    ];

    return (
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', opacity, ...node.styles }}>
            {badges.map((Badge, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Badge.icon size={20} color={fill} />
                    <span style={{ fontSize: '8px', fontWeight: 900, color: fill, letterSpacing: '0.1em' }}>{Badge.label}</span>
                </div>
            ))}
        </div>
    );
};

/**
 * OmnoraPolicyBlock: Descriptive guarantee blocks.
 */
export const OmnoraPolicyBlock: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const node = nodes[nodeId];

    if (!node) return null;

    const items = [
        { icon: Truck, path: 'props.policy1' },
        { icon: RefreshCw, path: 'props.policy2' }
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', ...node.styles }}>
            {items.map((item, i) => (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <item.icon size={18} color="var(--accent-primary)" strokeWidth={1} />
                    <div style={{ fontSize: '11px', fontWeight: 500 }}>
                        <EditableText nodeId={nodeId} path={item.path} tag="div" />
                    </div>
                </div>
            ))}
        </div>
    );
};
