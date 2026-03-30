import { SectionType, getRegistryEntry, getRegistry } from '../components/cms/BuilderRegistry';

/**
 * Omnora OS: Core Type Definitions
 * 'any' is strictly forbidden to maintain engine integrity.
 */
type BuilderValue = string | number | boolean | null | undefined | { [key: string]: BuilderValue } | BuilderValue[];
type BuilderNodeProps = Record<string, BuilderValue>;

interface BuilderNode {
    type: string;
    parentId: string | null;
    children?: string[];
    [key: string]: BuilderValue | string[] | string | null | undefined;
}

/**
 * Schema-Driven Deep Merge.
 * Logic: Inline 'any' removed. Using double-casting (unknown -> T) to satisfy the linter
 * while maintaining the deep merge logic.
 */
export const deepMergeProps = <T extends BuilderNodeProps>(
    type: SectionType | string,
    initial: T,
    incoming: Partial<T>
): T => {
    getRegistryEntry(type);

    const result = { ...initial } as T;

    Object.keys(incoming).forEach((key) => {
        const incomingVal = incoming[key];
        const initialVal = initial[key];

        if (
            incomingVal && 
            typeof incomingVal === 'object' && 
            !Array.isArray(incomingVal) && 
            initialVal && 
            typeof initialVal === 'object' &&
            !Array.isArray(initialVal)
        ) {
            // FIX: Using unknown as an intermediate step to avoid 'any'
            (result as Record<string, unknown>)[key] = { 
                ...(initialVal as Record<string, unknown>), 
                ...(incomingVal as Record<string, unknown>) 
            };
        } else {
            (result as Record<string, unknown>)[key] = incomingVal;
        }
    });

    return result;
};

/**
 * SafeStateEngine: Narrow-Path Updates.
 * Logic: Path-based cloning with structural sharing.
 */
export const safeDeepUpdate = <T extends Record<string, unknown>>(
    obj: T,
    path: string,
    value: unknown
): T => {
    const keys = path.split('.');
    const result = { ...obj };
    let current = result as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextTarget = current[key];
        
        current[key] = (typeof nextTarget === 'object' && nextTarget !== null)
            ? { ...(nextTarget as Record<string, unknown>) } 
            : {};
            
        current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return result as T;
};

/**
 * InvariantWatcher: OS.POLICER.
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

export const verifyInvariants = (
    nodes: Record<string, BuilderNode>,
    layouts: Record<string, string[]>
): SystemHealthReport => {
    const report: SystemHealthReport = {
        status: 'STABLE',
        invariants: { cycles: [], orphans: [], deadReferences: [], registryGaps: [] },
        timestamp: new Date().toISOString()
    };

    const nodeIds = Object.keys(nodes);
    const referencedIds = new Set<string>();
    const registry = getRegistry();

    Object.values(layouts).forEach(pageNodes => pageNodes.forEach(id => referencedIds.add(id)));
    
    Object.values(nodes).forEach(node => {
        const children = node.children as string[] | undefined;
        children?.forEach((childId: string) => referencedIds.add(childId));
        if (!registry[node.type]) report.invariants.registryGaps.push(node.type);
    });

    nodeIds.forEach(id => {
        if (!referencedIds.has(id)) report.invariants.orphans.push(id);
    });

    referencedIds.forEach(id => {
        if (!nodes[id]) report.invariants.deadReferences.push(id);
    });

    const checkCycle = (id: string, visited = new Set<string>()): boolean => {
        if (visited.has(id)) return true;
        visited.add(id);
        const node = nodes[id];
        const children = node?.children as string[] | undefined;
        if (children) {
            for (const childId of children) {
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