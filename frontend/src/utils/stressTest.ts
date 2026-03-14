import { nodeStore } from '../platform/core/NodeStore';
import { dispatcher } from '../platform/core/Dispatcher';
import { BLOCK_TYPES } from '../platform/core/Registry';

const SECTION_TYPES = BLOCK_TYPES;

const stressTest = () => {
    console.log('--- OMNORA ENGINE STRESS TEST ---');

    // 1. Bootstrap 500 nodes
    const initialNodes: any = {};
    for (let i = 0; i < 500; i++) {
        initialNodes[`node-${i}`] = {
            id: `node-${i}`,
            type: SECTION_TYPES.CONTAINER,
            props: { title: `Node ${i}` },
            children: [],
            parentId: null,
            revision: 0
        };
    }

    nodeStore._update(() => ({
        nodes: initialNodes,
        pageLayouts: { home: Object.keys(initialNodes) }
    }));

    console.log(`Initialized ${Object.keys(nodeStore.getState().nodes).length} nodes.`);

    // 2. Patch Storm
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
        dispatcher.dispatch({
            nodeId: `node-${Math.floor(Math.random() * 500)}`,
            path: 'props.title',
            value: `Updated Title ${i}`,
            type: 'visual',
            source: 'system'
        });
    }
    const endTime = performance.now();

    console.log(`Dispatched 100 patches in ${(endTime - startTime).toFixed(2)}ms.`);
    console.log(`Average patch cost: ${((endTime - startTime) / 100).toFixed(2)}ms.`);

    if ((endTime - startTime) / 100 < 1) {
        console.log('✅ PERFORMANCE TARGET MET: < 1ms per patch apply.');
    } else {
        console.log('❌ PERFORMANCE WARNING: Patch application slower than expected.');
    }

    // 3. Verification of Revisions
    const randomNode = nodeStore.getState().nodes['node-0'];
    console.log(`Sample Node Revision: ${randomNode.revision}`);
};

// Only run in dev/test
if (process.env.NODE_ENV === 'development') {
    (window as any).omnoraStressTest = stressTest;
}
