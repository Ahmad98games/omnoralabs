/**
 * aiContentService.js
 * Async AI content generation with prompt engineering, cache, and BullMQ queue.
 * Supports English, Urdu, and Roman Urdu outputs.
 */
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const logger = require('./logger');
const aiQuota = require('./aiQuotaService');

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt({ type, niche, tone, brandSoul = 'luxury', language, length, storeName, extraContext = '', refinement = '' }) {
    const SOUL_INST = {
        luxury: 'Exude absolute commanding authority, understated elegance, and high-ticket exclusivity. Avoid generic advertising adjectives; use authoritative phrasing describing heritage, scarcity, and craftsmanship.',
        dark: 'Be rebellious, mysterious, and high-impact. Focus on raw authenticity, cinematic edges, and edge-design aesthetic.',
        friendly: 'Be warm, welcoming, and accessible. Use conversational language that builds absolute trust and common ground.'
    };
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

    const soulInstruction = SOUL_INST[brandSoul] || `[Creative Partner Mode] Adapt tone and layout instructions strictly to this custom vision: "${brandSoul}".`;

    return `ROLE: Professional e-commerce copywriter specializing in Pakistani market.
STORE: ${storeName || 'Online Store'}
NICHE: ${niche}
TONE: ${tone}
BRAND SOUL: ${soulInstruction}
TARGET: Pakistani online shoppers
LANGUAGE: ${LANG_INST[language] || LANG_INST.english}
LENGTH: ${LENGTH_INST[length] || LENGTH_INST.medium}
TASK: ${TYPE_INST[type] || `Write ${type} copy.`}
${extraContext ? `EXTRA CONTEXT: ${extraContext}` : ''}
${refinement ? `REFINEMENT REQUEST: ${refinement}` : ''}
OUTPUT: Only the copy text. No labels, no explanations, no quotes around the output.`;
}

// ─── Hash context for deduplication ──────────────────────────────────────────

function hashContext(context) {
    return crypto.createHash('sha256').update(JSON.stringify(context)).digest('hex').slice(0, 16);
}

// ─── Check cache ─────────────────────────────────────────────────────────────

async function getCached(sellerId, type, contextHash) {
    const { data, error } = await supabase
        .from('ai_content')
        .select('*')
        .eq('merchant_id', sellerId)
        .eq('content_type', type) // Map type to content_type
        .eq('context_hash', contextHash)
        .eq('status', 'done')
        .maybeSingle();
    
    return error ? null : data;
}

// ─── Queue job (async generation) ────────────────────────────────────────────

async function generateContent(sellerId, { type, niche, tone = 'professional', brandSoul = 'luxury', language = 'english', length = 'medium', storeName = 'My Store', extraContext = '', refinement = '', forceRegenerate = false }) {
    const queueService = require('./queueService');

    // ── Quota & rate guard ────────────────────────────────────────────────────
    const quota = await aiQuota.checkAndConsume(sellerId);
    if (!quota.allowed) {
        logger.warn(`AI_QUOTA: Blocked for ${sellerId}`, { reason: quota.reason, used: quota.used });
        return { allowed: false, reason: quota.reason, used: quota.used, limit: quota.limit, retryAfterSec: quota.retryAfterSec };
    }

    const context = { type, niche, tone, brandSoul, language, length, storeName, extraContext, refinement };
    const contextHash = hashContext(context);

    // Return cached result if available and not forcing regenerate
    if (!forceRegenerate) {
        const cached = await getCached(sellerId, type, contextHash);
        if (cached) {
            logger.info(`AI_CONTENT: Cache hit for ${sellerId}/${type}/${language}`);
            return { cached: true, status: 'done', result: cached.result, id: cached.id };
        }
    }

    // Build prompt and queue job
    const prompt = buildPrompt({ type, niche, tone, brandSoul, language, length, storeName, extraContext, refinement });

    // Upsert a pending record
    const { data: record, error } = await supabase
        .from('ai_content')
        .upsert({ 
            merchant_id: sellerId, 
            content_type: type, 
            context_hash: contextHash,
            prompt, 
            status: 'pending', 
            metadata: { language, length, storeName, niche, tone, extraContext },
            result: null, 
            error_msg: null 
        }, { onConflict: 'merchant_id,content_type,context_hash' })
        .select()
        .single();

    if (error) throw error;

    // Queue for async processing
    const queued = await queueService.safeAdd('ai-content', 'generate', {
        recordId: record.id.toString(),
        sellerId,
        prompt,
        type,
        contextHash,
    });

    if (!queued.success) {
        // Fallback: process synchronously if queue unavailable (dev mode)
        logger.warn('AI_CONTENT: Queue unavailable — returning pending status');
        return { cached: false, status: 'pending', result: null, id: record.id };
    }

    logger.info(`AI_CONTENT: Job queued for ${sellerId}/${type}`, { jobId: queued.jobId });
    return { cached: false, status: 'pending', result: null, id: record.id };
}

// ─── Clear cache ──────────────────────────────────────────────────────────────

async function clearCache(sellerId, type) {
    await supabase
        .from('ai_content')
        .update({ status: 'pending', result: null, updated_at: new Date() })
        .eq('merchant_id', sellerId)
        .eq('content_type', type);
    return { cleared: true };
}

// ─── Get result by type ───────────────────────────────────────────────────────

async function getResult(sellerId, type) {
    const { AiContent } = getModels();
    return AiContent.findOne({ sellerId, type });
}

/**
 * conversionInsights: Analyze dummy JSON behavioral data and return 3 actionable tips.
 */
async function generateConversionInsights(behavioralData) {
    try {
        const clicks = behavioralData.clicks || 0;
        const bounceRate = behavioralData.bounceRate || 0;
        const cartAdds = behavioralData.cartAdds || 0;
        const dropOffs = behavioralData.dropOffs || 0;

        const tips = [];

        if (bounceRate > 60) {
            tips.push({
                title: "Optimize Hero Text Above Fold",
                description: "High Bounce Rate detected. Adjust phrasing to trigger immediate interest above the fold triggers.",
                why: "Based on typical user attention models, users assess trust in under 3 seconds. Unclear headlines increase exits immediately."
            });
        } else {
            tips.push({
                title: "Immersive Sub-Fold Interaction",
                description: "Focus on keeping users engaged down-page with rich parallax/mesh triggers.",
                why: "A low bounce rate proves primary interest; down-page animations retain cognitive triggers making shoppers browse deep layouts."
            });
        }

        if (cartAdds - dropOffs > 5) {
            tips.push({
                title: "Simplify Checkout Steps",
                description: "Cart addition is strong. Remove optional inputs fields to seal quick deals buffers.",
                why: "When purchasing intent hits peak thresholds, any transactional Friction node drops total checkouts by 10% averages."
            });
        } else {
            tips.push({
                title: "High Contrast Product CTAs",
                description: "Add to Cart conversion is slightly low. Contrast items with glowing depth weights to draw focus.",
                why: "Visual hierarchy guides action. Submerged nodes blend with backgrounds reducing item pickup metrics securely."
            });
        }

        if (clicks > 500 && cartAdds < 20) {
            tips.push({
                title: "Premium Contrast Theme Canvas",
                description: "Traffic is high but commitment is low. Test darker atmospheric overlays for retail glow weights.",
                why: "Deep themes frame product images with higher luxury depth values, increasing visual justification pricing ratios."
            });
        } else {
             tips.push({
                title: "Retain Current Multi Grid Setup",
                description: "Continue leveraging current metrics; visual harmony is keeping customers browsing.",
                why: "Grid alignment distributes ocular weight equally keeping total viewport buffers scrolling safely."
            });
        }

        return tips.slice(0, 3); // Guarantee 3 tips
    } catch (e) {
        return [{ title: "Optimize conversion", description: "Standard load triggers", why: "E-Commerce standards" }];
    }
}

/**
 * generateCommandSummary: Analyze dashboard stats and return 1-sentence commanding authority summary.
 */
async function generateCommandSummary(stats) {
    try {
        const axios = require('axios');
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return "Empire growth node sustained. Focus on high-intent luxury segments.";

        const prompt = `You are an elite e-commerce advisor commanding absolute authority. Review these metrics and return exactly ONE sentence of strategic command or summary. Be concise, authoritative, and direct. Omit explanations.
        
        Metrics: ${JSON.stringify(stats)}`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: 'Return ONLY the sentence output.' }, { role: 'user', content: prompt }],
            temperature: 0.4
        }, { headers: { Authorization: `Bearer ${apiKey}` } });

        return response.data.choices[0].message.content.trim();
    } catch (e) {
        return "Command cycle active. Maintain focus on revenue generation metrics.";
    }
}

module.exports = { generateContent, getCached, clearCache, getResult, buildPrompt, hashContext, generateConversionInsights, generateCommandSummary };
