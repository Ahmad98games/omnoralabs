import React from 'react';
import { useOmnora } from '../../client/OmnoraContext';
import { TextBlock, ImageBlock } from '../../components/OmnoraBlocks';
import { BLOCK_TYPES as SECTION_TYPES, RegistryEntry, BlockProps } from '../../core/Registry';
import { useNodeSelector } from '../../../hooks/useNodeSelector';

/**
 * FEATURE_GRID_V5
 * A production-grade, hardened grid component for SaaS ecommerce builders.
 * Follows Level 5 Architecture: Pure Platform Implementation.
 */

// 1. Default Props Constants
export const FEATURE_GRID_V5_DEFAULTS = {
    title: 'Precision Powered Features',
    subtitle: 'Engineered for high-conversion ecommerce experiences.',
    columns: 3,
    gap: 32,
    features: [
        {
            id: 'feat-1',
            title: 'Instant Resilience',
            desc: 'System-wide invariant policing ensures no document corruption.',
            image: 'placeholder_icon_1'
        },
        {
            id: 'feat-2',
            title: 'O(1) Performance',
            desc: 'Structural sharing minimizes serialization overhead at scale.',
            image: 'placeholder_icon_2'
        },
        {
            id: 'feat-3',
            title: 'Deep Hydration',
            desc: 'Schema-driven merging preserves all component defaults.',
            image: 'placeholder_icon_3'
        }
    ],
    styles: {
        background: '#ffffff',
        paddingTop: '80px',
        paddingBottom: '80px',
        maxWidth: '1200px'
    }
};

// 2. Inspector Schema
export const FEATURE_GRID_V5_SCHEMA: RegistryEntry['propSchema'] = {
    'props.title': { type: 'text', label: 'Main Title' },
    'props.subtitle': { type: 'text', label: 'Subtitle' },
    'props.columns': { type: 'number', label: 'Columns (1-4)' },
    'props.gap': { type: 'number', label: 'Grid Gap (px)' },
    'props.styles.background': { type: 'color', label: 'Background Color' },
    'props.styles.paddingTop': { type: 'text', label: 'Padding Top' },
    'props.styles.paddingBottom': { type: 'text', label: 'Padding Bottom' }
};

// 3. Component Implementation
export const FeatureGridv5: React.FC<BlockProps> = React.memo(({ nodeId }) => {
    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        styles: n.styles,
        revision: n.revision
    }));

    if (!node) return null;

    const { title, subtitle, columns = 3, gap = 32, features = [] } = node.props || {};
    const styles = node.props?.styles || {};

    return (
        <section style={{
            background: styles.background || '#fff',
            paddingTop: styles.paddingTop || '60px',
            paddingBottom: styles.paddingBottom || '60px',
            width: '100%',
            overflow: 'hidden'
        }}>
            <div style={{
                maxWidth: styles.maxWidth || '1100px',
                margin: '0 auto',
                padding: '0 24px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <TextBlock
                        nodeId={nodeId}
                        path="props.title"
                        tag="h2"
                        className="feature-grid-title"
                        style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}
                    />
                    <TextBlock
                        nodeId={nodeId}
                        path="props.subtitle"
                        tag="p"
                        className="feature-grid-subtitle"
                        style={{ fontSize: '16px', color: '#6B7280', margin: 0, maxWidth: '600px', marginInline: 'auto' }}
                    />
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: `${gap}px`,
                }}>
                    {features.map((feature: any, index: number) => (
                        <div key={feature.id || index} style={{
                            padding: '24px',
                            background: '#F9FAFB',
                            borderRadius: '16px',
                            border: '1px solid #F3F4F6',
                            transition: 'transform 0.2s ease'
                        }}>
                            <div style={{ width: '48px', height: '48px', marginBottom: '20px' }}>
                                <ImageBlock
                                    nodeId={nodeId}
                                    path={`props.features.${index}.image`}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <TextBlock
                                nodeId={nodeId}
                                path={`props.features.${index}.title`}
                                tag="h4"
                                style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}
                            />
                            <TextBlock
                                nodeId={nodeId}
                                path={`props.features.${index}.desc`}
                                tag="p"
                                style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, margin: 0 }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .feature-grid-v5-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.05);
                }
            `}</style>
        </section>
    );
});

// 4. Instance Factory
export const createFeatureGridv5 = (overrides = {}): any => ({
    type: SECTION_TYPES.FEATURE_GRID_V5,
    props: {
        ...FEATURE_GRID_V5_DEFAULTS,
        ...overrides
    },
    children: [],
    schemaVersion: 1
});

// 5. Registry Definition Object
export const FeatureGridv5_Definition: RegistryEntry = {
    type: SECTION_TYPES.FEATURE_GRID_V5,
    component: FeatureGridv5,
    defaultProps: FEATURE_GRID_V5_DEFAULTS,
    propSchema: FEATURE_GRID_V5_SCHEMA,
    metadata: {
        label: 'Feature Grid V5 (Platform Native)',
        category: 'Marketing'
    },
    schemaVersion: 1,
    migrate: (oldNode) => {
        if (!oldNode.schemaVersion || oldNode.schemaVersion < 1) {
            return {
                ...oldNode,
                props: {
                    ...FEATURE_GRID_V5_DEFAULTS,
                    ...oldNode.props,
                },
                schemaVersion: 1
            };
        }
        return oldNode;
    }
};
