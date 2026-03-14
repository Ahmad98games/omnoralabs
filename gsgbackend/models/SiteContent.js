const { createModel } = require('../utils/modelFactory');

const schema = {
    seller: { type: String, required: true },
    tenant_id: { type: String, required: true, unique: true },
    tenant_slug: { type: String, required: true, unique: true }, // Slug for platform.com/store/:slug

    // Versioned Data Blocks
    published: {
        globalStyles: { type: Object, default: {} },
        configuration: { type: Object, default: {} },
        pages: { 
            byId: { type: Object, default: {} },
            allIds: { type: Array, default: [] }
        },
        pageLayouts: { type: Object, default: {} },
        nodes: { type: Object, default: {} }
    },

    draft: {
        globalStyles: { type: Object, default: {} },
        configuration: { type: Object, default: {} },
        pages: { 
            byId: { type: Object, default: {} },
            allIds: { type: Array, default: [] }
        },
        pageLayouts: { type: Object, default: {} },
        nodes: { type: Object, default: {} }
    },

    // Snapshot History (Phase 2)
    history: { type: Array, default: [] }, // Stores last 5 published manifests for rollback

    isActive: { type: Boolean, default: true },
    lastModifiedBy: { type: String },
    timestamp: { type: Date, default: Date.now }
};

module.exports = createModel('SiteContent', schema);
