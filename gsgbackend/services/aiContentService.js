/**
 * aiContentService.js
 * Async AI content generation with prompt engineering, cache, and BullMQ queue.
 * Supports English, Urdu, and Roman Urdu outputs.
 */
const crypto = require('crypto');
const logger = require('./logger');
const aiQuota = require('./aiQuotaService');

const getModels = () => ({ AiContent: require('../models/AiContent') });

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt({ type, niche, tone, language, length, storeName, extraContext = '' }) {
    const LANG_INST = {
        english: 'Write in fluent English.',
        urdu: 'اردو میں لکھیں۔ صرف اردو زبان استعمال کریں۔',
        'roman-urdu': 'Roman Urdu mein likhein (Urdu ko English haroof mein). Jaise: "Super quality products humari store par available hain."',
    };
    const LENGTH_INST = {
        short: 'Keep it under 15 words — punchy, memorable.',
        medium: 'Write 2–3 sentences. Clear and persuasive.',
        full: 'Write a complete paragraph (4–6 sentences). Detailed and compelling.',
    };
    const TYPE_INST = {
        'hero-headline': `Write a homepage hero headline for a ${niche} store.`,
        'product-description': `Write a product description for a ${niche} product.`,
        'about-us': `Write an About Us section for "${storeName}", a ${niche} store.`,
        'promo-banner': `Write a promotional banner message for a ${niche} store.`,
    };

    return `ROLE: Professional e-commerce copywriter specializing in Pakistani market.
STORE: ${storeName || 'Online Store'}
NICHE: ${niche}
TONE: ${tone}
TARGET: Pakistani online shoppers
LANGUAGE: ${LANG_INST[language] || LANG_INST.english}
LENGTH: ${LENGTH_INST[length] || LENGTH_INST.medium}
TASK: ${TYPE_INST[type] || `Write ${type} copy.`}
${extraContext ? `EXTRA CONTEXT: ${extraContext}` : ''}
OUTPUT: Only the copy text. No labels, no explanations, no quotes around the output.`;
}

// ─── Hash context for deduplication ──────────────────────────────────────────

function hashContext(context) {
    return crypto.createHash('sha256').update(JSON.stringify(context)).digest('hex').slice(0, 16);
}

// ─── Check cache ─────────────────────────────────────────────────────────────

async function getCached(sellerId, type, contextHash) {
    const { AiContent } = getModels();
    return AiContent.findOne({ sellerId, type, contextHash, status: 'done' });
}

// ─── Queue job (async generation) ────────────────────────────────────────────

async function generateContent(sellerId, { type, niche, tone = 'professional', language = 'english', length = 'medium', storeName = 'My Store', extraContext = '', forceRegenerate = false }) {
    const { AiContent } = getModels();
    const queueService = require('./queueService');

    // ── Quota & rate guard ────────────────────────────────────────────────────
    const quota = await aiQuota.checkAndConsume(sellerId);
    if (!quota.allowed) {
        logger.warn(`AI_QUOTA: Blocked for ${sellerId}`, { reason: quota.reason, used: quota.used });
        return { allowed: false, reason: quota.reason, used: quota.used, limit: quota.limit, retryAfterSec: quota.retryAfterSec };
    }

    const context = { type, niche, tone, language, length, storeName, extraContext };
    const contextHash = hashContext(context);

    // Return cached result if available and not forcing regenerate
    if (!forceRegenerate) {
        const cached = await getCached(sellerId, type, contextHash);
        if (cached) {
            logger.info(`AI_CONTENT: Cache hit for ${sellerId}/${type}/${language}`);
            return { cached: true, status: 'done', result: cached.result, id: cached._id };
        }
    }

    // Build prompt and queue job
    const prompt = buildPrompt({ type, niche, tone, language, length, storeName, extraContext });

    // Upsert a pending record
    const record = await AiContent.findOneAndUpdate(
        { sellerId, type, contextHash },
        { $set: { prompt, status: 'pending', language, length, result: null, errorMsg: null } },
        { upsert: true, new: true }
    );

    // Queue for async processing
    const queued = await queueService.safeAdd('ai-content', 'generate', {
        recordId: record._id?.toString(),
        sellerId,
        prompt,
        type,
        contextHash,
    });

    if (!queued.success) {
        // Fallback: process synchronously if queue unavailable (dev mode)
        logger.warn('AI_CONTENT: Queue unavailable — returning pending status');
        return { cached: false, status: 'pending', result: null, id: record._id };
    }

    logger.info(`AI_CONTENT: Job queued for ${sellerId}/${type}`, { jobId: queued.jobId });
    return { cached: false, status: 'pending', result: null, id: record._id };
}

// ─── Clear cache ──────────────────────────────────────────────────────────────

async function clearCache(sellerId, type) {
    const { AiContent } = getModels();
    await AiContent.findOneAndUpdate({ sellerId, type }, { $set: { status: 'pending', result: null, regeneratedAt: new Date() } });
    return { cleared: true };
}

// ─── Get result by type ───────────────────────────────────────────────────────

async function getResult(sellerId, type) {
    const { AiContent } = getModels();
    return AiContent.findOne({ sellerId, type });
}

module.exports = { generateContent, getCached, clearCache, getResult, buildPrompt, hashContext };
