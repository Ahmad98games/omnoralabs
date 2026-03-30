/**
 * NodeCloner: Deep recursive cloning for Omnora OS Builder Nodes
 * Ensuring Law 8 (Atomic Updates) by creating fresh, typed references.
 */

export interface OmnoraNode {
    id: string;
    type: string;
    parentId: string | null;
    children: string[];
    props: Record<string, unknown>;
    styles: Record<string, string>;
    [key: string]: unknown; // For future-proofing custom metadata
}

interface CloneResult {
    clonedNodes: Record<string, OmnoraNode>;
    clonedLayout: string[];
}

export const cloneNodeTree = (
    rootIds: string[], 
    nodes: Record<string, OmnoraNode>
): CloneResult => {
    const clonedNodes: Record<string, OmnoraNode> = {};
    const clonedLayout: string[] = [];

    const cloneNode = (nodeId: string, parentId: string | null = null): string => {
        const node = nodes[nodeId];
        if (!node) return '';

        // Generate a surgical unique ID for the clone
        const newId = `node_${node.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        const newNode: OmnoraNode = {
            ...node,
            id: newId,
            parentId,
            children: [] as string[],
            // Ensure deep copies of objects to prevent reference leakage
            props: JSON.parse(JSON.stringify(node.props || {})),
            styles: JSON.parse(JSON.stringify(node.styles || {})),
        };

        // Recursively clone children with type safety
        if (node.children && Array.isArray(node.children)) {
            newNode.children = node.children
                .map((childId: string) => cloneNode(childId, newId))
                .filter(Boolean);
        }

        clonedNodes[newId] = newNode;
        return newId;
    };

    rootIds.forEach(id => {
        const newRootId = cloneNode(id);
        if (newRootId) clonedLayout.push(newRootId);
    });

    return { clonedNodes, clonedLayout };
};