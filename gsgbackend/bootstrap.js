const { validateEnv } = require('./config/env');
const dbService = require('./services/dbService');
const logger = require('./services/logger');
const stateService = require('./services/stateService');
const { LIFECYCLE, INFRA } = require('./services/stateService');

let started = false;

async function bootstrap() {
    if (started) {
        return { app: require('./server'), config: validateEnv() };
    }

    stateService.setLifecycle(LIFECYCLE.BOOTING);
    logger.info('Starting system bootstrap...');

    // 1. Environment Validation
    let config;
    try {
        config = validateEnv();
    } catch (error) {
        logger.error('BOOTSTRAP_FAILURE: Invalid configuration', { error: error.message });
        process.exit(1);
    }

    // 2. Database Connection
    // 2. Database Connection
    if (config.mongo.uri) {
        logger.info('SYSTEM: Connecting to MongoDB...');
        try {
            await dbService.connect(config.mongo.uri);
            stateService.setInfraStatus(INFRA.DB, true);
            logger.info('SYSTEM: MongoDB Connected Successfully');
        } catch (error) {
            logger.error('SYSTEM: MongoDB Connection Failed', { error: error.message });
            // If in production, this is fatal. In dev, maybe fallback to LocalDB?
            // But since Models have already chosen Mongoose mode based on URI presence, 
            // we cannot easily switch model implementation at runtime without reload.
            // So we must exit or let it fail.
            stateService.setInfraStatus(INFRA.DB, false);
            if (process.env.NODE_ENV === 'production') process.exit(1);
        }
    } else {
        // FORCE LOCAL MODE: Skipping MongoDB connection since we are using LocalDB adapter
        logger.info('SYSTEM: Using LocalDB (File-based persistence). MongoDB connection skipped.');
        stateService.setInfraStatus(INFRA.DB, true); // Mark DB as ready immediately
    }

    // 3. Finalize Lifecycle (Async health checks will update stateService)
    const currentLifecycle = stateService.getSnapshot().lifecycle;
    if (currentLifecycle === LIFECYCLE.BOOTING) {
        stateService.setLifecycle(LIFECYCLE.READY);
    }

    // In DEGRADED mode (Dev only), we still want to finish bootstrap
    if (stateService.getSnapshot().lifecycle === LIFECYCLE.DEGRADED) {
        logger.warn('SYSTEM_STATUS: Starting in DEGRADED mode');
    }

    // Register Shutdown Hooks
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    started = true;
    logger.info('System bootstrap completed', { mode: stateService.getSnapshot().lifecycle });

    return { app: require('./server'), config };
}

async function shutdown(signal = 'MANUAL') {
    const snapshot = stateService.getSnapshot();
    if (snapshot.lifecycle === LIFECYCLE.DRAINING || snapshot.lifecycle === LIFECYCLE.TERMINATED) return;

    logger.info(`Shutdown sequence initiated (${signal})`);
    stateService.setLifecycle(LIFECYCLE.DRAINING);

    // Enforce 10s shutdown timeout (SLA Protection)
    const forcedExit = setTimeout(() => {
        logger.error('SHUTDOWN_TIMEOUT: Forcing exit after 10s');

        // Weighted SLA Sampling
        // Mutations: 100%, Reads: 10%
        const isCritical = snapshot.lifecycle === LIFECYCLE.DRAINING; // Simple critical proxy
        if (isCritical || Math.random() < 0.1) {
            logger.error('SYSTEM_SLA_BREACH: DRAIN_TIMEOUT_VIOLATION', {
                version: snapshot.version,
                state: snapshot.lifecycle
            });
        }

        process.exit(1);
    }, 10000);

    try {
        const queueService = require('./services/queueService');
        await Promise.all([
            dbService.disconnect(),
            queueService.closeQueues()
        ]);

        stateService.setLifecycle(LIFECYCLE.TERMINATED);
        logger.info('Graceful shutdown completed successfully');
        clearTimeout(forcedExit);
        process.exit(0);
    } catch (err) {
        logger.error('SHUTDOWN_ERROR: Cleanup failed', { error: err.message });
        process.exit(1);
    }
}

module.exports = bootstrap;
