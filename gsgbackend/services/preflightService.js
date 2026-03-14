/**
 * Publish Preflight Validator
 * Audits the site manifest for common issues before allowing a publish.
 */

function validateManifest(manifest) {
    const issues = [];
    const pages = manifest.pages || {};
    const globalStyles = manifest.globalStyles || {};

    // 1. Audit Freeform Boundaries
    Object.entries(pages).forEach(([pageId, page]) => {
        const nodes = page.nodes || [];
        nodes.forEach(node => {
            const positions = node.props?.elementPositions || {};
            Object.entries(positions).forEach(([elemId, pos]) => {
                if (pos.mode === 'free') {
                    // Check for extreme off-canvas (Warn if > 2000 or < -2000)
                    if (Math.abs(pos.x) > 2048 || Math.abs(pos.y) > 2048) {
                        issues.push({
                            severity: 'warning',
                            code: 'OFF_CANVAS_ELEMENT',
                            message: `Element ${elemId} in page ${pageId} is very far off-canvas.`,
                            suggest: 'Reset to flow or Move closer'
                        });
                    }
                }
            });

            // 2. Audit Mobile Hidden Nodes (Potential PII or critical CTAs)
            if (node.hidden?.mobile) {
                if (node.type === 'featured_product' || node.type === 'hero') {
                    issues.push({
                        severity: 'info',
                        code: 'MOBILE_HIDDEN_CRITICAL',
                        message: `Critical node ${node.type} is hidden on mobile.`,
                        suggest: 'Ensure this is intentional'
                    });
                }
            }
        });
    });

    // 3. Global Style Sanity
    if (!globalStyles.primaryColor) {
        issues.push({
            severity: 'warning',
            code: 'MISSING_BRANDING',
            message: 'Primary brand color is not set.',
            suggest: 'Set a primary color in global styles'
        });
    }

    return {
        isValid: issues.filter(i => i.severity === 'error').length === 0,
        issues
    };
}

module.exports = { validateManifest };
