import React from 'react';
import { motion } from 'framer-motion';
import { useOmnoraBase } from '../client/OmnoraContext';
import { TextBlock, ContainerBlock, ImageBlock, ButtonBlock } from '../components/OmnoraBlocks';
import { LinkResolver } from '../navigation/LinkResolver';

/**
 * HeroBlock: High-impact entry section.
 */
export const HeroBlock: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnoraBase();
    const node = nodes[nodeId];

    if (!node) return null;

    const layout = node.props?.layout || 'background';
    const isSplit = layout === 'left' || layout === 'right';

    return (
        <section
            className={`omnora-hero ${layout}`}
            style={{
                minHeight: node.props?.height || '80vh',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--db-bg)',
                ...node.styles
            }}
        >
            <div className="container" style={{
                display: 'flex',
                flexDirection: layout === 'right' ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: '4rem'
            }}>
                <div style={{ flex: 1, textAlign: isSplit ? 'left' : 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <TextBlock
                            nodeId={nodeId}
                            path="props.headline"
                            tag="h1"
                            style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--p-color)' }}
                        />
                        <TextBlock
                            nodeId={nodeId}
                            path="props.subheadline"
                            tag="p"
                            style={{ fontSize: '1.2rem', opacity: 0.7, marginBottom: '2.5rem', color: 'var(--s-color)' }}
                        />

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: isSplit ? 'flex-start' : 'center' }}>
                            <LinkResolver to={node.props?.links?.cta}>
                                <ButtonBlock nodeId={nodeId} textPath="props.ctaText" />
                            </LinkResolver>
                        </div>
                    </motion.div>
                </div>

                {isSplit && (
                    <div style={{ flex: 1 }}>
                        <ImageBlock
                            nodeId={nodeId}
                            path="props.backgroundImage"
                            style={{ width: '100%', aspectRatio: '4/5', borderRadius: '12px' }}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

/**
 * TextContentBlock: Standard editorial content.
 */
export const TextContentBlock: React.FC<{ nodeId: string }> = ({ nodeId }) => (
    <ContainerBlock
        nodeId={nodeId}
        className="omnora-text-content py-20"
        style={{ background: 'var(--db-bg)' }}
    >
        <div className="container max-w-3xl">
            <TextBlock
                nodeId={nodeId}
                path="props.title"
                tag="h2"
                style={{ marginBottom: '2rem', color: 'var(--p-color)' }}
            />
            <div className="prose prose-invert" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <TextBlock nodeId={nodeId} path="props.body" />
            </div>
        </div>
    </ContainerBlock>
);

/**
 * ProductGridBlock: Static structural grid for products.
 */
export const ProductGridBlock: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnoraBase();
    const node = nodes[nodeId];
    if (!node) return null;

    return (
        <section className="omnora-product-grid py-20" style={{ background: 'var(--db-bg)' }}>
            <div className="container">
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <TextBlock
                        nodeId={nodeId}
                        path="props.eyebrow"
                        style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem' }}
                    />
                    <TextBlock
                        nodeId={nodeId}
                        path="props.title"
                        tag="h2"
                    />
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '2rem'
                }}>
                    {/* Placeholder for real product mapping which happens in specialized Commerce modules */}
                    <div style={{
                        padding: '6rem',
                        border: '1px dashed rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        gridColumn: '1 / -1'
                    }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.3, fontWeight: 900 }}>PRODUCT SLOT: {node.props?.category || 'ALL'}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

/**
 * SpacerBlock: Invisible structural gap.
 */
export const SpacerBlock: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnoraBase();
    const node = nodes[nodeId];
    return <div style={{ height: node?.props?.height || '40px' }} />;
};
