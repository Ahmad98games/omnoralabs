/**
 * Omnora Binding Resolver (v2)
 * 
 * Converts {{source.path}} and {{source.path | filter}} strings into
 * real-time data from the StorefrontContext.
 * 
 * DESIGN: Pipeline architecture — each `|` segment is a named formatter.
 * SAFETY: Unknown paths return '' (silent fail). Unknown filters pass through.
 */

export type BindingFilter = (value: any, ...args: string[]) => any;

// ─── Built-in Filters ─────────────────────────────────────────────────────────

const FILTERS: Record<string, BindingFilter> = {
    /** Format number as money: 299 → "$299.00" */
    money: (value: any, currencySymbol?: string) => {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return '';
        const symbol = currencySymbol || '$';
        return `${symbol}${num.toFixed(2)}`;
    },

    /** Uppercase transform */
    upcase: (value: any) => String(value ?? '').toUpperCase(),

    /** Lowercase transform */
    downcase: (value: any) => String(value ?? '').toLowerCase(),

    /** Capitalize first letter */
    capitalize: (value: any) => {
        const s = String(value ?? '');
        return s.charAt(0).toUpperCase() + s.slice(1);
    },

    /** Truncate string: {{product.description | truncate:80}} */
    truncate: (value: any, length?: string) => {
        const s = String(value ?? '');
        const max = parseInt(length || '100', 10);
        return s.length > max ? s.slice(0, max) + '...' : s;
    },

    /** Default value if empty: {{product.vendor | default:"Unknown"}} */
    default: (value: any, fallback?: string) => {
        return (value === null || value === undefined || value === '') ? (fallback || '') : value;
    },

    /** Image URL resizer hint: {{product.featured_image | img_url:400}} */
    img_url: (value: any, width?: string) => {
        if (typeof value !== 'string') return '';
        const w = width || '800';
        // Append width param for Unsplash-style URLs or pass through
        if (value.includes('unsplash.com')) {
            return value.replace(/w=\d+/, `w=${w}`);
        }
        return value;
    },

    /** JSON stringify for debug: {{product | json}} */
    json: (value: any) => {
        try { return JSON.stringify(value, null, 2); }
        catch { return '[Circular]'; }
    },

    /** Pluralize: {{collection.productsCount | pluralize:"item":"items"}} */
    pluralize: (value: any, singular?: string, plural?: string) => {
        const num = typeof value === 'number' ? value : parseInt(String(value), 10);
        if (isNaN(num)) return '';
        return `${num} ${num === 1 ? (singular || 'item') : (plural || 'items')}`;
    },
};

// ─── Binding Resolver ─────────────────────────────────────────────────────────

export class BindingResolver {
    private static BINDING_REGEX = /\{\{(.+?)\}\}/g;

    /**
     * Resolve a string or object containing bindings.
     * @param input The raw prop value (e.g., "Price: {{product.price | money}}")
     * @param context The current data context (product, collection, store, etc.)
     */
    static resolve(input: any, context: Record<string, any>): any {
        if (typeof input !== 'string') return input;

        // Direct binding: "{{product.price | money}}" → return the resolved type
        const trimmed = input.trim();
        if (trimmed.startsWith('{{') && trimmed.endsWith('}}') && (trimmed.match(/\{\{/g) || []).length === 1) {
            const expression = trimmed.slice(2, -2).trim();
            return this.evaluateExpression(expression, context);
        }

        // Template interpolation: "Hello {{product.title}}, only {{product.price | money}}"
        return input.replace(this.BINDING_REGEX, (_, expression) => {
            const result = this.evaluateExpression(expression.trim(), context);
            return result !== undefined && result !== null ? String(result) : '';
        });
    }

    /**
     * Evaluate a single expression with optional filter pipeline.
     * e.g., "product.price | money" or "product.description | truncate:80"
     */
    private static evaluateExpression(expression: string, context: Record<string, any>): any {
        const segments = expression.split('|').map(s => s.trim());
        const path = segments[0];

        // Step 1: Resolve the raw value from the context
        let value = this.getValueByPath(context, path);

        // Step 2: Apply each filter in the pipeline
        for (let i = 1; i < segments.length; i++) {
            const filterExpr = segments[i];
            const [filterName, ...args] = filterExpr.split(':').map(s => s.trim().replace(/^["']|["']$/g, ''));

            const filterFn = FILTERS[filterName];
            if (filterFn) {
                value = filterFn(value, ...args);
            }
            // Silent fail: unknown filters pass through without crashing
        }

        return value;
    }

    /**
     * Traverse a dot-separated path into a nested context object.
     * Returns undefined for invalid paths (silent fail).
     */
    private static getValueByPath(obj: any, path: string): any {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((acc, part) => {
            if (acc === null || acc === undefined) return undefined;
            return acc[part];
        }, obj);
    }

    /**
     * Register a custom filter at runtime.
     * Allows plugin authors to extend the binding engine.
     */
    static registerFilter(name: string, fn: BindingFilter): void {
        FILTERS[name] = fn;
    }

    /**
     * Check if a string contains any binding expressions.
     * Useful for optimization — skip resolution for static strings.
     */
    static hasBindings(input: any): boolean {
        if (typeof input !== 'string') return false;
        return this.BINDING_REGEX.test(input);
    }
}
