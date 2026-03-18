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
     * Build the system prompt for high-fidelity AST generation.
     */
    buildStorePrompt() {
        return `ROLE: Senior AI Systems Engineer & E-commerce Architect.
TASK: Generate a complete, multi-page storefront AST for Omnora OS.
STRICT JSON SCHEMA: { pages: { byId, allIds }, nodes: {}, pageLayouts: {}, designSystem: {} }
AESTHETIC: Luxury, Cinematic, OLED Black.`;
    }

    async generateStoreAST(merchantId, prompt) {
        try {
            if (!this.groqKey) {
                throw new Error('Missing GROQ_API_KEY for Forge');
            }

            const systemPrompt = this.buildStorePrompt();
            
            // 🛡️ Outboard Call with 60-second Timeout protection
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a storefront for: "${prompt}"` }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            }, {
                headers: { Authorization: `Bearer ${this.groqKey}` },
                timeout: 60000 
            });

            const content = response.data.choices[0].message.content;

            // 🛡️ Safe JSON Parser Fallback
            try {
                return JSON.parse(content);
            } catch (pErr) {
                console.warn('[AST Parse Failed] Attempting regex extraction...');
                const match = content.match(/\{[\s\S]*\}/);
                if (match) return JSON.parse(match[0]);
                throw pErr;
            }

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
