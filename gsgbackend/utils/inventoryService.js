// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const logger = require('../services/logger');

/**
 * Calculate available stock for a product
 * @param {Object} product - Product document
 * @returns {number} - Available stock
 */
function getAvailableStock(product) {
    const stock = Number(product.inventory_count || 0); // Correct Supabase column
    const reserved = Number(product.metadata?.reservedStock || 0);
    return Math.max(0, stock - reserved);
}

/**
 * Reserve stock for order items
 * @param {Array} items - Array of { product: productId, quantity: number }
 * @throws {Error} - If insufficient stock
 */
async function reserveStock(items) {
    for (const item of items) {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product || item.productId)
            .maybeSingle();

        if (error || !product) {
            throw new Error(`Product not found: ${item.product || item.productId}`);
        }

        const availableStock = getAvailableStock(product);
        if (availableStock < item.quantity) {
            throw new Error(
                `Insufficient stock for ${product.title}. ` +
                `Available: ${availableStock}, Requested: ${item.quantity}`
            );
        }

        // Reserve the stock in metadata
        const currentReserved = Number(product.metadata?.reservedStock || 0);
        await supabase
            .from('products')
            .update({ 
                metadata: { ...product.metadata, reservedStock: currentReserved + item.quantity } 
            })
            .eq('id', product.id);

        logger.info('Stock reserved in Supabase', {
            productId: product.id,
            productName: product.title,
            quantity: item.quantity
        });
    }
}

/**
 * Decrement stock after order approval
 * @param {Array} items - Array of { product: productId, quantity: number }
 */
async function decrementStock(items) {
    for (const item of items) {
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product || item.productId)
            .maybeSingle();

        if (!product) continue;

        const currentStock = Number(product.inventory_count || 0);
        const currentReserved = Number(product.metadata?.reservedStock || 0);

        await supabase
            .from('products')
            .update({ 
                inventory_count: Math.max(0, currentStock - item.quantity),
                metadata: { ...product.metadata, reservedStock: Math.max(0, currentReserved - item.quantity) }
            })
            .eq('id', product.id);

        logger.info('Stock decremented in Supabase', { productId: product.id });
    }
}

/**
 * Release reserved stock (on order cancellation/rejection)
 * @param {Array} items - Array of { product: productId, quantity: number }
 */
async function releaseStock(items) {
    for (const item of items) {
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product || item.productId)
            .maybeSingle();

        if (!product) continue;

        const currentReserved = Number(product.metadata?.reservedStock || 0);
        await supabase
            .from('products')
            .update({ 
                metadata: { ...product.metadata, reservedStock: Math.max(0, currentReserved - item.quantity) }
            })
            .eq('id', product.id);

        logger.info('Stock released in Supabase', { productId: product.id });
    }
}

/**
 * Check if items are in stock
 * @param {Array} items - Array of { product: productId, quantity: number }
 * @returns {Promise<{inStock: boolean, outOfStock: Array}>}
 */
async function checkStock(items) {
    const outOfStock = [];

    for (const item of items) {
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product || item.productId)
            .maybeSingle();

        if (!product) {
            outOfStock.push({ productId: item.product, reason: 'Product not found' });
            continue;
        }

        const availableStock = getAvailableStock(product);
        if (availableStock < item.quantity) {
            outOfStock.push({
                productId: product.id,
                productName: product.title,
                requested: item.quantity,
                available: availableStock
            });
        }
    }

    return {
        inStock: outOfStock.length === 0,
        outOfStock: outOfStock.map(i => ({
            productId: i.productId,
            productName: i.productName,
            status: 'Out of Stock' // Obfuscate raw numbers
        }))
    };
}

module.exports = {
    reserveStock,
    decrementStock,
    releaseStock,
    checkStock,
    getAvailableStock
};
