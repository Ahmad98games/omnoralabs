/**
 * SymbolManager: Global Master Component Registry
 *
 * ARCHITECTURE:
 * - A "Symbol" is a reusable master component blueprint.
 * - When a user saves a block as a Symbol, its current node config (props, styles, children)
 *   is stored here under a unique `symbolId`.
 * - Any node in the NodeStore that carries a `symbolId` is an "Instance".
 * - When ANY instance is edited via the Dispatcher, the SymbolManager intercepts the patch,
 *   updates the master blueprint, and then propagates the change to ALL other instances
 *   sharing the same `symbolId`, triggering their re-render.
 *
 * DISPATCHER INTEGRATION:
 *   The Dispatcher's `executeTransaction` method should call
 *   `symbolManager.propagateIfSymbol(patch, updatedNodes)` after applying a patch.
 *   If the patched node has a `symbolId`, propagateIfSymbol will:
 *     1. Update the master blueprint in the registry.
 *     2. Find all other nodes with the same `symbolId`.
 *     3. Apply the same patch path/value to each of them.
 *     4. Return the full set of updated nodes so the NodeStore can notify them all.
 */

import { nodeStore } from './NodeStore';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SymbolBlueprint {
    symbolId: string;
    name: string;
    sourceType: string;           // e.g. 'site_footer', 'store_header'
    props: Record<string, any>;
    styles: Record<string, any>;
    responsive?: Record<string, any>;
    children: string[];           // child node IDs (structural template)
    createdAt: number;
    updatedAt: number;
}

// ─── Singleton Registry ──────────────────────────────────────────────────────

type Listener = () => void;

class SymbolManager {
    private registry: Map<string, SymbolBlueprint> = new Map();
    private listeners: Set<Listener> = new Set();

    // ── Read ──────────────────────────────────────────────────────────────

    getBlueprint(symbolId: string): SymbolBlueprint | undefined {
        return this.registry.get(symbolId);
    }

    getAllSymbols(): SymbolBlueprint[] {
        return Array.from(this.registry.values());
    }

    // ── Write ─────────────────────────────────────────────────────────────

    /**
     * Save a node as a new Symbol.
     * Returns the generated symbolId so the caller can assign it to the node.
     */
    createSymbol(name: string, node: { type: string; props: Record<string, any>; styles: Record<string, any>; responsive?: Record<string, any>; children: string[] }): string {
        const symbolId = `sym_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const blueprint: SymbolBlueprint = {
            symbolId,
            name,
            sourceType: node.type,
            props: { ...node.props },
            styles: { ...node.styles },
            responsive: node.responsive ? { ...node.responsive } : undefined,
            children: [...node.children],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.registry.set(symbolId, blueprint);
        this.notify();
        return symbolId;
    }

    /**
     * Unlink a symbol entirely.
     */
    deleteSymbol(symbolId: string): void {
        this.registry.delete(symbolId);
        this.notify();
    }

    // ── Dispatcher Integration ────────────────────────────────────────────

    /**
     * Called by the Dispatcher AFTER a patch is applied to a single node.
     * If the node has a `symbolId`, this method:
     *   1. Updates the master blueprint.
     *   2. Returns a list of OTHER node IDs that share the same symbolId
     *      so the Dispatcher can apply the same patch to them.
     *
     * @returns Array of sibling instance node IDs (excluding the source node).
     */
    propagateIfSymbol(
        sourceNodeId: string,
        patchPath: string,
        patchValue: unknown
    ): string[] {
        const state = nodeStore.getState();
        const sourceNode = state.nodes[sourceNodeId];
        if (!sourceNode) return [];

        const symbolId = (sourceNode as any).symbolId as string | undefined;
        if (!symbolId) return [];

        // 1. Update master blueprint
        const blueprint = this.registry.get(symbolId);
        if (blueprint) {
            this.setByPath(blueprint, patchPath, patchValue);
            blueprint.updatedAt = Date.now();
        }

        // 2. Find sibling instances
        const siblingIds: string[] = [];
        const allNodes = state.nodes;
        for (const id of Object.keys(allNodes)) {
            if (id === sourceNodeId) continue;
            if ((allNodes[id] as any).symbolId === symbolId) {
                siblingIds.push(id);
            }
        }

        return siblingIds;
    }

    // ── Subscription ──────────────────────────────────────────────────────

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // ── Internal ──────────────────────────────────────────────────────────

    private notify() {
        this.listeners.forEach(l => l());
    }

    private setByPath(obj: any, path: string, value: unknown): void {
        const keys = path.split('.');
        let cur = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (cur[keys[i]] === undefined) cur[keys[i]] = {};
            cur = cur[keys[i]];
        }
        cur[keys[keys.length - 1]] = value;
    }

    reset() {
        this.registry.clear();
        this.listeners.clear();
    }
}

export const symbolManager = new SymbolManager();
