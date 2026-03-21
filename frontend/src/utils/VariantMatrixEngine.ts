export interface VariantOption {
    name: string; // e.g., 'Size', 'Color'
    values: string[]; // e.g., ['S', 'M', 'L']
}

export interface ProductVariant {
    id: string; // uuid
    name: string; // e.g., 'Large / Red'
    price_override: number | null;
    stock: number;
    sku: string;
}

/**
 * Generates all possible combinations (Cartesian Product) from the given options.
 * Example Input: [{name: 'Size', values: ['S', 'M']}, {name: 'Color', values: ['Red', 'Blue']}]
 * Example Output: ['S / Red', 'S / Blue', 'M / Red', 'M / Blue']
 */
export const generateVariantMatrix = (options: VariantOption[]): ProductVariant[] => {
    // Filter out empty options or empty values
    const validOptions = options.filter(opt => opt.name.trim() !== '' && opt.values.length > 0);
    
    if (validOptions.length === 0) return [];

    // Helper function for Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
        return arrays.reduce<string[][]>((a, b) => 
            a.flatMap(d => b.map(e => [...d, e])),
            [[]]
        );
    };

    const valueArrays = validOptions.map(opt => opt.values);
    const combinations = cartesian(valueArrays);

    return combinations.map(combo => {
        const name = combo.join(' / ');
        const skuTag = combo.map(v => v.substring(0, 3).toUpperCase()).join('-');
        
        return {
            id: crypto.randomUUID(),
            name,
            price_override: null,
            stock: 0,
            sku: `VAR-${skuTag}-${Math.floor(Math.random() * 1000)}`
        };
    });
};

/**
 * Merges a newly generated matrix with an existing one to preserve 
 * previously set prices/stock when the user adds a new option value.
 */
export const mergeVariantMatrix = (existingVariants: ProductVariant[], newMatrix: ProductVariant[]): ProductVariant[] => {
    return newMatrix.map(newVar => {
        const existing = existingVariants.find(ex => ex.name === newVar.name);
        if (existing) {
            return existing; // Preserve price_override and stock
        }
        return newVar;
    });
};
