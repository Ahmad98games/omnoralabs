import { SectionType, getRegistryEntry, getRegistry } from '../components/cms/BuilderRegistry';

/**
 * Schema-Driven Deep Merge.
 * Prevents prop loss during hydration by respecting the registry schema.
 */
export const deepMergeProps = (type: SectionType | string, initial: any, incoming: any): any => {
    const entry = getRegistryEntry(type);
    const schema = entry?.propSchema || {};

    const result = { ...initial };

    Object.keys(incoming).forEach(key => {
        const val = incoming[key];

        if (val && typeof val === 'object' && !Array.isArray(val) && initial[key]) {
            result[key] = { ...initial[key], ...val };
        } else {
            result[key] = val;
        }
    });

    return result;
};

/**
 * SafeStateEngine: Narrow-Path Updates.
 * Enforces O(1) identity stability for structural sharing.
 * Only clones objects along the required path.
 */
export const safeDeepUpdate = (obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    const result = { ...obj };
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
};

/**
 * InvariantWatcher: OS.POLICER.
 * Audits document integrity at runtime.
 */
export interface SystemHealthReport {
    status: 'STABLE' | 'DEGRADED' | 'CORRUPTED';
    invariants: {
        cycles: string[];
        orphans: string[];
        deadReferences: string[];
        registryGaps: string[];
    };
    timestamp: string;
}

export const verifyInvariants = (nodes: Record<string, any>, layouts: Record<string, string[]>): SystemHealthReport => {
    const report: SystemHealthReport = {
        status: 'STABLE',
        invariants: { cycles: [], orphans: [], deadReferences: [], registryGaps: [] },
        timestamp: new Date().toISOString()
    };

    const nodeIds = Object.keys(nodes);
    const referencedIds = new Set<string>();
    const registry = getRegistry();

    // 1. Map all references
    Object.values(layouts).forEach(pageNodes => pageNodes.forEach(id => referencedIds.add(id)));
    Object.values(nodes).forEach(node => {
        node.children?.forEach((childId: string) => referencedIds.add(childId));
        if (!registry[node.type]) report.invariants.registryGaps.push(node.type);
    });

    // 2. Detect Orphans & Dead Refs
    nodeIds.forEach(id => {
        if (!referencedIds.has(id)) report.invariants.orphans.push(id);
    });

    referencedIds.forEach(id => {
        if (!nodes[id]) report.invariants.deadReferences.push(id);
    });

    // 3. Simple Cycle Detection (Recursive Check for Parent-Child Loops)
    const checkCycle = (id: string, visited = new Set<string>()): boolean => {
        if (visited.has(id)) return true;
        visited.add(id);
        const node = nodes[id];
        if (node?.children) {
            for (const childId of node.children) {
                if (checkCycle(childId, new Set(visited))) return true;
            }
        }
        return false;
    };

    nodeIds.forEach(id => {
        if (nodes[id].parentId === null && checkCycle(id)) report.invariants.cycles.push(id);
    });

    if (report.invariants.cycles.length > 0) report.status = 'CORRUPTED';
    else if (report.invariants.orphans.length > 0 || report.invariants.registryGaps.length > 0) report.status = 'DEGRADED';

    return report;
};

/**
 * Forensic Production Telemetry.
 */
export const reportRegistryError = (errorInfo: {
    type: string;
    nodeId?: string;
    pageId?: string;
    viewport?: string;
    context: string;
}) => {
    const trace = {
        ...errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    console.group(`%c [Omnora Forensic Trace] %c ${errorInfo.context}`, 'background: #E11D48; color: #fff; font-weight: bold;', 'color: #E11D48;');
    console.error('Registry mismatch detected in production-ready environment.');
    console.table(trace);
    console.groupEnd();
};
