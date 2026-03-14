const logger = require('../services/logger');
const Order = require('../models/Order');
const { releaseStock } = require('../utils/inventoryService');

/**
 * Cleanup Job for INITIATED Orders
 * Auto-cancels orders that remain in INITIATED status beyond the timeout period
 * 
 * Default: 2 hours (strict)
 * Configurable up to 4 hours
 * 
 * NEVER set to 24h - stale INITIATED orders poison analytics
 */

const CLEANUP_TIMEOUT_HOURS = process.env.INITIATED_ORDER_TIMEOUT_HOURS || 2;
const MAX_TIMEOUT_HOURS = 4;

// Validate timeout configuration
if (CLEANUP_TIMEOUT_HOURS > MAX_TIMEOUT_HOURS) {
    logger.warn(`INITIATED_ORDER_TIMEOUT_HOURS (${CLEANUP_TIMEOUT_HOURS}) exceeds maximum (${MAX_TIMEOUT_HOURS}). Using maximum.`);
}

const timeoutHours = Math.min(CLEANUP_TIMEOUT_HOURS, MAX_TIMEOUT_HOURS);

async function cleanupInitiatedOrders() {
    try {
        const cutoffTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

        logger.info('Starting cleanup of INITIATED orders', {
            cutoffTime,
            timeoutHours
        });

        // Find all INITIATED orders older than cutoff time
        const initiatedOrders = await Order.find({
            status: 'INITIATED',
            createdAt: { $lt: cutoffTime }
        });

        if (initiatedOrders.length === 0) {
            logger.info('No INITIATED orders to clean up');
            return {
                success: true,
                cleaned: 0
            };
        }

        logger.info(`Found ${initiatedOrders.length} INITIATED orders to clean up`);

        let cleaned = 0;
        let errors = 0;

        for (const order of initiatedOrders) {
            try {
                // Update order status to cancelled
                order.status = 'cancelled';
                order.cancelledAt = new Date();
                order.cancelReason = 'Abandoned - WhatsApp message not sent';
                await order.save();

                // Release any reserved stock (though INITIATED shouldn't have reserved stock)
                try {
                    await releaseStock(order.items);
                } catch (stockError) {
                    logger.warn('Failed to release stock for abandoned order', {
                        orderId: order._id,
                        error: stockError.message
                    });
                }

                logger.info('Cleaned up abandoned INITIATED order', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    age: Math.round((Date.now() - order.createdAt.getTime()) / (60 * 60 * 1000)) + ' hours'
                });

                cleaned++;
            } catch (error) {
                logger.error('Failed to clean up INITIATED order', {
                    orderId: order._id,
                    error: error.message
                });
                errors++;
            }
        }

        logger.info('Cleanup job completed', {
            total: initiatedOrders.length,
            cleaned,
            errors
        });

        return {
            success: true,
            cleaned,
            errors
        };
    } catch (error) {
        logger.error('Cleanup job failed', { error: error.message });
        return {
            success: false,
            error: error.message
        };
    }
}

// Run cleanup job if executed directly
if (require.main === module) {
    cleanupInitiatedOrders()
        .then(result => {
            console.log('Cleanup result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Cleanup error:', error);
            process.exit(1);
        });
}

module.exports = { cleanupInitiatedOrders };
