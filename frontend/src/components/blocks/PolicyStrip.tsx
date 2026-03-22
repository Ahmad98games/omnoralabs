import React from 'react';

export interface PolicyStripProps {
    nodeId: string;
    isBuilder?: boolean;
    policies?: { label: string; icon?: string; linkUrl: string }[];
    layout?: 'row' | 'stacked';
    separator?: 'divider' | 'dot' | 'none';
    fontSize?: 'sm' | 'md';
}

const DEFAULT_POLICIES = [
    { label: "Refund Policy", icon: "return-arrow", linkUrl: "/refunds" },
    { label: "Terms of Service", icon: "lock", linkUrl: "/terms" },
    { label: "Privacy Policy", icon: "shield-check", linkUrl: "/privacy" }
];

const SVG_ICONS: Record<string, React.ReactNode> = {
    'shield-check': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"/></svg>,
    'truck': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l4 4v4h-4zm-8 11a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/></svg>,
    'return-arrow': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5M4 9h12a5 5 0 015 5v3"/></svg>,
    'lock': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
};

export const PolicyStrip: React.FC<PolicyStripProps> = ({
    nodeId,
    isBuilder = false,
    policies = DEFAULT_POLICIES,
    layout = 'row',
    separator = 'dot',
    fontSize = 'sm'
}) => {
    const isStacked = layout === 'stacked';
    const fSize = fontSize === 'sm' ? '12px' : '13px';

    return (
        <div 
            data-node-id={nodeId}
            style={{
                display: 'flex',
                flexDirection: isStacked ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isStacked ? 8 : 0,
                padding: '10px 16px',
                fontFamily: "'Inter', -apple-system, sans-serif",
                flexWrap: 'wrap'
            }}
        >
            {policies.map((policy, i) => (
                <React.Fragment key={i}>
                    {i > 0 && !isStacked && separator !== 'none' && (
                        <span style={{ 
                            padding: '0 12px', 
                            color: '#4a4a60', 
                            fontSize: fSize,
                            userSelect: 'none'
                        }}>
                            {separator === 'divider' ? '|' : '•'}
                        </span>
                    )}
                    <a 
                        href={isBuilder ? undefined : policy.linkUrl}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#8b8ba0',
                            textDecoration: 'none',
                            fontSize: fSize,
                            fontWeight: 500,
                            transition: 'color 0.12s',
                            cursor: isBuilder ? 'default' : 'pointer'
                        }}
                        onMouseEnter={e => { if (!isBuilder) e.currentTarget.style.color = '#f0f0f5'; }}
                        onMouseLeave={e => { if (!isBuilder) e.currentTarget.style.color = '#8b8ba0'; }}
                    >
                        {policy.icon && SVG_ICONS[policy.icon] && (
                            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center' }}>
                                {SVG_ICONS[policy.icon]}
                            </span>
                        )}
                        <span>{policy.label}</span>
                    </a>
                </React.Fragment>
            ))}
        </div>
    );
};

export default PolicyStrip;
