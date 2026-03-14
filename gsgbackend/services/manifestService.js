/**
 * Manifest Sterilization Service
 * recursively strips unwanted editor/debug properties from the site manifest
 * before serving to the public storefront.
 */

const STRIP_KEYS = [
    'selectedNodeId',
    'editorFlags',
    'debugProps',
    'internalId',
    'draft',
    'tempOverrides',
    'tempX',
    'tempY',
    'isDragging',
    'selected',
    'hovered'
];

/**
 * recursively sanitize an object or array
 */
function sanitizeManifest(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeManifest(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (STRIP_KEYS.includes(key)) continue;

        // Deep sterilization for nested structures like 'pages' or 'nodes'
        sanitized[key] = sanitizeManifest(value);
    }
    return sanitized;
}

module.exports = { sanitizeManifest };
