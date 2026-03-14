import { nodeStore } from './NodeStore';
import { getRegistryEntry } from '../../components/cms/BuilderRegistry';

export interface NodePatch {
    nodeId: string;
    path: string;
    value: unknown;
    type: 'visual' | 'structural';
    source: 'editor' | 'migration' | 'plugin' | 'system';
}

export interface PatchTransaction {
    id: string;
    patches: NodePatch[];
    inverse: NodePatch[];
    timestamp: number;
    impact: 'visual-local' | 'visual-contextual' | 'structural';
}

class Dispatcher {
    private queue: PatchTransaction[] = [];
    private processing = false;
    private reentrancyGuard = false;

    dispatch(patches: NodePatch | NodePatch[]) {
        const batch = Array.isArray(patches) ? patches : [patches];

        if (this.reentrancyGuard) {
            console.error("[Omnora Dispatcher] Recursive dispatch detected. Queueing.");
        }

        const transaction: PatchTransaction = {
            id: Math.random().toString(36).substring(2, 9),
            patches: batch,
            inverse: this.calculateInverses(batch),
            timestamp: Date.now(),
            impact: this.resolveMaxImpact(batch)
        };

        this.queue.push(transaction);

        if (!this.processing) {
            this.processQueue();
        }
    }

    private async processQueue() {
        this.processing = true;
        
        while (this.queue.length > 0) {
            const transaction = this.queue.shift()!;
            
            // Optimization: Wrap execution in rAF if impact is visual-local to keep 60fps
            if (transaction.impact === 'visual-local') {
                await new Promise(resolve => requestAnimationFrame(async () => {
                    await this.executeTransaction(transaction);
                    resolve(true);
                }));
            } else {
                await this.executeTransaction(transaction);
            }
        }
        
        this.processing = false;
    }

    private async executeTransaction(transaction: PatchTransaction) {
        const startTime = performance.now();
        this.reentrancyGuard = true;

        try {
            nodeStore._update((state) => {
                const updatedNodes = { ...state.nodes };

                transaction.patches.forEach(patch => {
                    const node = updatedNodes[patch.nodeId];
                    if (node) {
                        updatedNodes[patch.nodeId] = this.applyPatchToNode(node, patch);
                    }
                });

                return { nodes: updatedNodes };
            });

            const duration = performance.now() - startTime;
            if (duration > 8) {
                console.warn(`[Omnora Profiler] Long Transaction: ${transaction.id} (${duration.toFixed(2)}ms)`);
            }
        } finally {
            this.reentrancyGuard = false;
        }
    }

    private applyPatchToNode(node: any, patch: NodePatch): any {
        // Increment revision at the root level of the node
        const nextRevision = (node.revision || 0) + 1;
        
        // Use recursive immutable setter to ensure no "Silent Mutations"
        const newNode = this.immutableSet(node, patch.path.split('.'), patch.value);
        
        return { ...newNode, revision: nextRevision };
    }

    private immutableSet(obj: any, path: string[], value: any): any {
        if (path.length === 0) return value;
        
        const [head, ...tail] = path;
        const isArray = Array.isArray(obj);
        const clone = isArray ? [...(obj || [])] : { ...(obj || {}) };
        
        clone[head] = this.immutableSet(clone[head], tail, value);
        return clone;
    }

    private resolveMaxImpact(patches: NodePatch[]): 'visual-local' | 'visual-contextual' | 'structural' {
        let maxImpact: 'visual-local' | 'visual-contextual' | 'structural' = 'visual-local';
        patches.forEach(patch => {
            const node = nodeStore.getNode(patch.nodeId);
            if (!node) return;
            const entry = getRegistryEntry(node.type);
            const impact = entry?.patchImpactMap?.[patch.path] || 'structural';
            if (impact === 'structural') maxImpact = 'structural';
            else if (impact === 'visual-contextual' && maxImpact !== 'structural') maxImpact = 'visual-contextual';
        });
        return maxImpact;
    }

    private calculateInverses(patches: NodePatch[]): NodePatch[] {
        return patches.map(patch => ({
            ...patch,
            value: this.getValueByPath(nodeStore.getNode(patch.nodeId), patch.path),
            source: 'system'
        }));
    }

    private getValueByPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    reset() {
        this.queue = [];
        this.processing = false;
        this.reentrancyGuard = false;
    }
}

export const dispatcher = new Dispatcher();