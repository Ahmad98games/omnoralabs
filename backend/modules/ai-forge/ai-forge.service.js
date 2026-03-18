const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../shared/services/logger');
const { supabase } = require('../../shared/lib/supabaseClient');

/**
 * AI Forge Domain Service
 * 
 * Centralized logic for store generation, content creation, and quota orchestration.
 * profit.
 */
class AIForgeService {
    constructor() {
        this.openaiKey = process.env.OPENAI_API_KEY;
        this.groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
        this.openaiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    // ─── Store Generation (AST) ──────────────────────────────────────────────

    /**
     * Build the system prompt for concise Blueprint generation.
     */
    buildStorePrompt() {
        return `ROLE: AI E-commerce Architect.
TASK: Generate ONLY a JSON configuration for the requested store niche. Do not write items like HTML or CSS. 
Just return keys for 'colors' (primary, background, text), 'fonts' (heading, body), 'hero_title', and 'sections_list' (array of strings e.g., ["features", "testimonials"]).
STICK TO JSON only.`;
    }

    async generateStoreAST(merchantId, prompt) {
        try {
            if (!this.groqKey) {
                throw new Error('Missing GROQ_API_KEY for Forge');
            }

            const systemPrompt = this.buildStorePrompt();
            
            // 🛡️ Outboard Call with 9-second Timeout protection (Vercel compliance)
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a store blueprint for: "${prompt}"` }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false,
                response_format: { type: "json_object" }
            }, {
                headers: { Authorization: `Bearer ${this.groqKey}` },
                timeout: 9000 
            });

            const content = response.data.choices[0].message.content;
            let blueprint = {};

            // 🛡️ Safe JSON Parser Fallback
            try {
                blueprint = JSON.parse(content);
            } catch (pErr) {
                console.warn('[Blueprint Parse Failed] Attempting regex extraction...');
                const match = content.match(/\{[\s\S]*\}/);
                if (match) blueprint = JSON.parse(match[0]);
                else throw pErr;
            }

            // 🛡️ Translate Blueprint to Full AST for frontend Injection compatibilities
            return {
                pages: { 
                    home: { 
                        title: "Home", 
                        layout: [
                            { 
                                type: 'hero', 
                                data: { headline: blueprint.hero_title || 'Exquisite Elegance', subtitle: 'Crafted for the sovereign.' } 
                            },
                            ...(blueprint.sections_list || []).map((sec, idx) => ({
                                type: sec.toLowerCase().includes('grid') ? 'product-grid' : 'feature-cards',
                                data: { title: sec }
                            }))
                        ] 
                    } 
                },
                designSystem: {
                    colors: blueprint.colors || { primary: '#D4AF37', background: '#050505', text: '#FFFFFF' },
                    fonts: blueprint.fonts || ['Outfit', 'Inter']
                }
            };

        } catch (err) {
            console.error('Groq Error:', err.message);
            
            // 🛡️ Fallback Default Template as safe recovery
            return {
                pages: { 
                    home: { 
                        title: "The Imperial Boutique", 
                        layout: [
                            { type: 'hero', data: { headline: 'Exquisite Elegance', subtitle: 'Crafted for the sovereign.' } },
                            { type: 'product-grid', data: { title: 'Featured Masterpieces' } }
                        ] 
                    }
                },
                designSystem: {
                    colors: { primary: '#D4AF37', background: '#050505' }
                }
            };
        }
    }

    // ─── Content Generation (NLP) ──────────────────────────────────────────────

    async generateCopy(merchantId, options) {
        const { type, niche, tone, language, length, storeName, extraContext } = options;
        
        // 1. Quota Check
        const quota = await this.checkQuota(merchantId);
        if (!quota.allowed) return quota;

        // 2. Hash Context for Cache
        const contextHash = crypto.createHash('sha256')
            .update(JSON.stringify(options))
            .digest('hex').slice(0, 16);

        // 3. Check Supabase Cache
        const { data: cached } = await supabase
            .from('ai_content')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('type', type)
            .eq('context_hash', contextHash)
            .eq('status', 'done')
            .maybeSingle();

        if (cached) return { cached: true, result: cached.result };

        // 4. Generate & Insert
        // (Queueing via BullMQ can be added here)
        // For now, structured for the domain module...
        return { status: 'pending', contextHash };
    }

    // ─── Quota Management ──────────────────────────────────────────────────────

    async checkQuota(merchantId) {
        const { data: quota, error } = await supabase
            .from('ai_quotas')
            .select('*')
            .eq('merchant_id', merchantId)
            .maybeSingle();

        if (error) throw error;
        
        if (!quota) {
            // Provision initial quota
            await supabase.from('ai_quotas').insert({ merchant_id: merchantId });
            return { allowed: true, remaining: 50 };
        }

        if (quota.monthly_used >= quota.monthly_limit) {
            return { allowed: false, reason: 'MONTHLY_QUOTA_EXHAUSTED' };
        }

        return { allowed: true, remaining: quota.monthly_limit - quota.monthly_used };
    }
}

module.exports = new AIForgeService();
