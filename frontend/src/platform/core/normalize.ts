import { PlatformBlock } from './types';
import { getRegistryEntry, BLOCK_TYPES } from './Registry';
import { Logger } from './Logger';

/**
 * normalizeNode: Pure function to sanitize and validate a raw JSON node.
 * Includes graceful migration failure handling and strict immutability.
 */
export const normalizeNode = (rawNode: any, id: string): PlatformBlock => {
    if (!rawNode) return createNullNode(id);

    const type = rawNode.type || 'container';
    const entry = getRegistryEntry(type);

    let processedNode = { ...rawNode };

    // ─── Resilience: Block Safety ───
    if (!entry) {
        Logger.warn(`Block type "${type}" for node ${id} not found in registry. Rendering recovery placeholder.`);
        return createFallbackNode(id, type);
    }

    // ─── Schema Migration (v4 Resilience) ───
    const currentVersion = processedNode.schemaVersion || 0;
    const targetVersion = entry.schemaVersion;

    if (currentVersion < targetVersion && entry.migrate) {
        try {
            Logger.info(`Migrating node ${id} (${type}) from v${currentVersion} to v${targetVersion}`);
            // Ensure migration is immutable by cloning
            const migrated = entry.migrate({ ...processedNode });
            processedNode = { ...migrated, schemaVersion: targetVersion };
        } catch (err) {
            Logger.error(`MIGRATION_FAILED: Failed to migrate node ${id} (${type}). Reverting to fallback.`, err);
            return createFallbackNode(id, type, 'Migration Failure');
        }
    }

    return {
        id: processedNode.id || id,
        type: processedNode.type || type,
        parentId: processedNode.parentId || null,
        props: processedNode.props || {},
        styles: processedNode.styles || {},
        children: Array.isArray(processedNode.children) ? processedNode.children : [],
        schemaVersion: targetVersion,
        binding: processedNode.binding || undefined,
        motion: {
            preset: processedNode.motion?.preset || 'none',
            duration: processedNode.motion?.duration || 400,
            curve: processedNode.motion?.curve || 'ease',
        },
        interactions: {
            hover: processedNode.interactions?.hover || {},
            active: processedNode.interactions?.active || {},
        },
        hidden: {
            desktop: !!processedNode.hidden?.desktop,
            tablet: !!processedNode.hidden?.tablet,
            mobile: !!processedNode.hidden?.mobile,
        },
        forcedState: processedNode.forcedState || null,
    };
};

/**
 * normalizeNodeTree: Batch normalization for an entire page state.
 */
export const normalizeNodeTree = (rawTree: Record<string, any>): Record<string, PlatformBlock> => {
    const normalized: Record<string, PlatformBlock> = {};
    Object.keys(rawTree).forEach(id => {
        normalized[id] = normalizeNode(rawTree[id], id);
    });
    return normalized;
};

/**
 * precomputeAdjacencyMap: Builds a Parent -> [Children] map.
 * v4: This logic is pure and operates on the IDs of a normalized tree.
 */
export const precomputeAdjacencyMap = (nodes: Record<string, PlatformBlock>): Record<string, string[]> => {
    const map: Record<string, string[]> = {};
    Object.values(nodes).forEach(node => {
        if (node.parentId) {
            if (!map[node.parentId]) map[node.parentId] = [];
            map[node.parentId].push(node.id);
        }
    });
    return map;
};

const createNullNode = (id: string): PlatformBlock => ({
    id,
    type: BLOCK_TYPES.SPACER,
    parentId: null,
    props: {},
    styles: { display: 'none' },
    children: [],
    schemaVersion: 1,
    hidden: { desktop: true, tablet: true, mobile: true }
});

const createFallbackNode = (id: string, originalType: string, reason = 'Missing Component'): PlatformBlock => ({
    id,
    type: BLOCK_TYPES.FALLBACK,
    parentId: null,
    props: { originalType, reason },
    styles: { background: 'rgba(255,0,0,0.05)', border: '1px dashed red', padding: '1rem' },
    children: [],
    schemaVersion: 1
});
