import { useSyncExternalStore, useCallback, useRef } from 'react';
import { nodeStore } from '../platform/core/NodeStore';
import { BindingResolver } from './BindResolver';
import { useStorefrontBinding } from '../context/StorefrontContext';

// Local Type definition for flexibility
export type BuilderNode = Record<string, unknown>;

/**
 * Deep resolution utility to process bindings recursively.
 * Skips non-string values for performance.
 */
function deepResolve(obj: unknown, context: Record<string, unknown>): unknown {
    if (typeof obj === 'string') return BindingResolver.resolve(obj, context);
    if (Array.isArray(obj)) return obj.map(v => deepResolve(v, context));
    if (obj !== null && typeof obj === 'object') {
        const out: Record<string, unknown> = {};
        for (const k in obj) {
            out[k] = deepResolve((obj as Record<string, unknown>)[k], context);
        }
        return out;
    }
    return obj;
}

/**
 * useNodeSelector: Granular subscription to a single node in NodeStore.
 * * Integrates with StorefrontContext for reactive data binding.
 * Uses version counter (not JSON.stringify) for cheap change detection.
 */
export function useNodeSelector<T>(
    nodeId: string,
    selector: (node: BuilderNode) => T
): T | undefined {
    // Cheap change detection via version counter — no JSON.stringify overhead
    const { bindingContext, version: storefrontVersion } = useStorefrontBinding();

    const cacheRef = useRef<{
        node: BuilderNode | undefined;
        revision: number;
        resolvedSelection: T | undefined;
        storefrontVersion: number;
    } | null>(null);

    const subscribe = useCallback((onStoreChange: () => void) => {
        return nodeStore.subscribeToNode(nodeId, onStoreChange);
    }, [nodeId]);

    const getSnapshot = useCallback(() => {
        const node = nodeStore.getNode(nodeId);
        // OSTT FIX: Using unknown casting to strictly define the nested node object structure
        const currentRevision = node ? Number((node as Record<string, unknown>).revision) || 0 : 0;

        // Cache hit: same node identity, same revision, same storefront version
        if (
            cacheRef.current &&
            cacheRef.current.node === node &&
            cacheRef.current.revision === currentRevision &&
            cacheRef.current.storefrontVersion === storefrontVersion
        ) {
            return cacheRef.current.resolvedSelection;
        }

        if (!node) {
            return undefined;
        }

        // 1. Get raw data from store
        const rawSelection = selector(node as unknown as BuilderNode);

        // 2. Resolve bindings using StorefrontContext data
        const resolvedSelection = deepResolve(rawSelection, bindingContext) as T;

        cacheRef.current = {
            node: node as unknown as BuilderNode,
            revision: currentRevision,
            resolvedSelection,
            storefrontVersion,
        };

        return resolvedSelection;
    }, [nodeId, selector, bindingContext, storefrontVersion]);

    return useSyncExternalStore(subscribe, getSnapshot);
}

export function useNode(nodeId: string): BuilderNode | undefined {
    return useNodeSelector(nodeId, (node) => node);
}