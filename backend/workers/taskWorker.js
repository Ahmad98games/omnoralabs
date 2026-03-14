/**
 * taskWorker.js
 * 
 * General-purpose background worker for Phase 53.
 * Processes CPU-intensive tasks like onboarding, syncing, and publishing.
 */

const { Worker } = require('bullmq');
const { connection, sendToDLQ } = require('../services/queueService');
const logger = require('../services/logger');
const onboardingService = require('../services/onboardingService');
const SiteContent = require('../models/SiteContent');
const { validateManifest } = require('../services/preflightService');
const aiStoreBuilderService = require('../services/aiStoreBuilderService');

const taskWorker = new Worker('background-tasks', async (job) => {
    const { name, data } = job;
    logger.info(`Starting background task: ${name}`, { jobId: job.id, tenant: data.tenantId });

    try {
        switch (name) {
            case 'launch_store': {
                const { sellerId, niche, storeName } = data;
                const result = await onboardingService.launchStore(sellerId, { niche, storeName });
                return result;
            }

            case 'sync_content': {
                const { tenantId, sellerId, updates, role } = data;
                const query = role === 'super-admin' ? { tenant_id: tenantId } : { tenant_id: tenantId, seller: sellerId };
                
                const content = await SiteContent.findOne(query);
                if (!content) throw new Error('Territory not found for sync');

                // Apply updates
                if (updates.pages) content.draft.pages = updates.pages;
                if (updates.nodes) content.draft.nodes = updates.nodes;
                if (updates.pageLayouts) content.draft.pageLayouts = updates.pageLayouts;
                if (updates.globalStyles) content.draft.globalStyles = { ...content.draft.globalStyles, ...updates.globalStyles };
                if (updates.configuration) content.draft.configuration = { ...content.draft.configuration, ...updates.configuration };

                content.markModified('draft');
                await content.save();
                return { success: true, message: 'Draft synced asynchronously' };
            }

            case 'publish_content': {
                const { tenantId, sellerId, role } = data;
                const query = role === 'super-admin' ? { tenant_id: tenantId } : { tenant_id: tenantId, seller: sellerId };
                
                const content = await SiteContent.findOne(query);
                if (!content) throw new Error('Target territory not found for publish');

                const audit = validateManifest(content.draft);
                if (!audit.isValid) throw new Error('Publish Blocked: Critical Safety Violations');

                const oldPublished = content.published ? JSON.parse(JSON.stringify(content.published)) : null;
                content.published = JSON.parse(JSON.stringify(content.draft));

                if (oldPublished) {
                    content.history = [oldPublished, ...content.history].slice(0, 5);
                }

                content.markModified('published');
                content.markModified('history');
                await content.save();
                return { success: true, message: 'Content published asynchronously' };
            }

            case 'generate_store': {
                const { sellerId, prompt, tenantId } = data;
                
                // 1. Call AI Generator
                const ast = await aiStoreBuilderService.generateStore(sellerId, prompt);
                
                // 2. Inject into SiteContent
                const content = await SiteContent.findOne({ tenant_id: tenantId });
                if (!content) throw new Error('Target store content not found for AI injection');

                content.draft.pages = ast.pages;
                content.draft.nodes = ast.nodes;
                content.draft.pageLayouts = ast.pageLayouts;
                content.draft.configuration = {
                    ...content.draft.configuration,
                    designSystem: ast.designSystem
                };

                content.markModified('draft');
                await content.save();

                return { success: true, message: 'Store generated and injected successfully', ast };
            }

            default:
                throw new Error(`Unknown background task type: ${name}`);
        }
    } catch (error) {
        logger.error(`Background task failed: ${name}`, { jobId: job.id, error: error.message });
        
        if (job.attemptsMade >= 3) {
            await sendToDLQ('background', job, error);
        }
        
        throw error;
    }
}, {
    connection,
    concurrency: 5,
    limiter: {
        max: 50,
        duration: 10000 // Rate limit burst protection
    }
});

taskWorker.on('completed', (job) => {
    logger.info(`Background task completed: ${job.name}`, { jobId: job.id });
});

taskWorker.on('failed', (job, err) => {
    logger.error(`Background task failed permanently: ${job?.name}`, { jobId: job?.id, error: err.message });
});

module.exports = taskWorker;
