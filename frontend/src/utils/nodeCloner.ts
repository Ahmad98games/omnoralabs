export const cloneNodeTree = (
    rootIds: string[], 
    nodes: Record<string, any>
): { clonedNodes: Record<string, any>; clonedLayout: string[] } => {
    const clonedNodes: Record<string, any> = {};
    const clonedLayout: string[] = [];

    const cloneNode = (nodeId: string, parentId: string | null = null): string => {
        const node = nodes[nodeId];
        if (!node) return '';

        const newId = `node_${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newNode = {
            ...node,
            id: newId,
            parentId,
            children: [] as string[]
        };

        // Recursively clone children
        if (node.children && Array.isArray(node.children)) {
            newNode.children = node.children.map((childId: string) => cloneNode(childId, newId)).filter(Boolean);
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
