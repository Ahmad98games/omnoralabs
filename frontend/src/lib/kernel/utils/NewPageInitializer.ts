/**
 * 🛠️ OMNORA LABS | [PAGE INITIALIZER]
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Kernel Core
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

export const NewPageInitializer = {
    /**
     * generateBlankAST: Generates a surgical, blank-slate AST for new system pages.
     */
    generateBlankAST() {
        const now = Date.now();
        const heroId = `node_herobanner_${now}_1`;
        const footerId = `node_footer_${now}_2`;
        return {
            nodes: {
                [heroId]: {
                    id: heroId,
                    type: 'HeroBanner',
                    parentId: null,
                    children: [],
                    props: {
                        headline: 'Welcome to your new page',
                        subheadline: 'Drag and drop blocks to start building',
                    },
                    styles: {}
                },
                [footerId]: {
                    id: footerId,
                    type: 'Footer',
                    parentId: null,
                    children: [],
                    props: { text: '© 2026 Powered by Omnora OS' },
                    styles: {}
                }
            },
            layout: [heroId, footerId]
        };
    }
};
