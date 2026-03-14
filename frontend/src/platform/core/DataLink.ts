/**
 * OMNORA v5 DATALINK CONTRACT
 * 
 * Defines the orchestration layer for async data resolution.
 * Transitions blocks from "Passive Prop Recipients" to "Data-Aware Entities".
 */

export type DataPriority = 'critical' | 'normal' | 'background';
export type ResolutionStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate';

export interface DataBinding<T = any> {
    key: string;            // Canonical cache key for deduplication
    source: string;         // e.g., 'commerce', 'marketing', 'user'
    params: Record<string, any>;
    select?: (raw: any) => T;
    strategy: ResolutionStrategy;
    priority: DataPriority;
    ttl?: number;           // Cache expiry in seconds
}

export interface DataLinkState {
    bindings: Record<string, DataBinding>;
    results: Record<string, any>;
    loading: Record<string, boolean>;
    errors: Record<string, string>;
}

/**
 * DataLink Orchestrator:
 * Responsible for collecting all bindings from the component tree 
 * and resolving them via batch queries.
 */
export interface DataLinkOrchestrator {
    registerBinding: (binding: DataBinding) => void;
    resolveAll: () => Promise<void>;
    getBinding: <T>(key: string) => T | undefined;
}
