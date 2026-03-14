import { BuilderNode } from '../../context/BuilderContext';

export interface NodeStoreState {
    nodes: Record<string, BuilderNode>;
    pageLayouts: Record<string, string[]>;
    revisions: Record<string, number>;
    globalRevision: number;
}

type Listener = () => void;

class NodeStore {
    private state: NodeStoreState = {
        nodes: {},
        pageLayouts: {},
        revisions: {},
        globalRevision: 0,
    };

    private listeners: Set<Listener> = new Set();
    private nodeListeners: Map<string, Set<Listener>> = new Map();

    getState() { return this.state; }
    getNode(id: string) { return this.state.nodes[id]; }
    getNodeRevision(id: string) { return this.state.revisions[id] || 0; }

    _update(updater: (state: NodeStoreState) => Partial<NodeStoreState>) {
        const changes = updater(this.state);
        if (!changes || Object.keys(changes).length === 0) return;

        const newState = { ...this.state, ...changes };
        const nodesToNotify: string[] = [];

        if (changes.nodes) {
            Object.keys(changes.nodes).forEach(id => {
                // If dispatcher provided a new reference, update internal revision map
                if (this.state.nodes[id] !== changes.nodes![id]) {
                    newState.revisions = {
                        ...newState.revisions,
                        [id]: (changes.nodes![id].revision || 0)
                    };
                    nodesToNotify.push(id);
                }
            });
        }

        newState.globalRevision++;
        this.state = newState;

        nodesToNotify.forEach(id => this.notifyNode(id));
        this.notify();
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    subscribeToNode(id: string, listener: Listener) {
        if (!this.nodeListeners.has(id)) this.nodeListeners.set(id, new Set());
        this.nodeListeners.get(id)!.add(listener);
        return () => {
            const nodeSet = this.nodeListeners.get(id);
            if (nodeSet) {
                nodeSet.delete(listener);
                if (nodeSet.size === 0) this.nodeListeners.delete(id);
            }
        };
    }

    private notify() { this.listeners.forEach(l => l()); }
    private notifyNode(id: string) { this.nodeListeners.get(id)?.forEach(l => l()); }

    createSnapshot(): NodeStoreState {
        return JSON.parse(JSON.stringify(this.state));
    }

    reset() {
        this.state = { nodes: {}, pageLayouts: {}, revisions: {}, globalRevision: 0 };
        this.listeners.clear();
        this.nodeListeners.clear();
        this.notify();
    }
}

export const nodeStore = new NodeStore();