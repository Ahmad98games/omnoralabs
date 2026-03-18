import { supabase } from '../../lib/supabaseClient';

export interface AIStoreJson {
  slug: string;
  ast_manifest: Array<{ type: string; props: any }>;
  theme_vars: Record<string, string>;
}

const SYSTEM_PROMPT = `
ACT AS THE "OMNORA OS" ARCHITECT AND STORE GENERATOR.

CONTEXT:
You are an expert in the Omnora PostgreSQL Schema. Your goal is to generate a high-conversion e-commerce store by outputting a strictly formatted JSON that fits into the 'store_pages' table's 'ast_manifest' column.

KNOWLEDGE BASE (Our Schema Rules):
1. TABLE 'merchants': Every store must link to a 'merchant_id' (UUID).
2. TABLE 'store_pages': Your output MUST be a valid 'ast_manifest' JSON object.
3. TABLE 'products': Reference products using their 'handle' or 'id'.
4. THEME_VARS: Support CSS variables like {"--primary-color": "#hex"}.

AVAILABLE COMPONENT LIBRARY (Use only these):
- HeroBanner: { title: string, subtitle: string, bgImage: string, cta: string }
- ProductGrid: { desktopColumns: number, category: string, gridGap: number }
- WhatsAppFloating: { phoneNumber: string, position: 'left'|'right' }
- TrustBadges: { items: Array<{icon: string, label: string}> }
- FAQ: { questions: Array<{q: string, a: string}> }

STRICT OUTPUT RULES:
- Output ONLY a minified JSON object. 
- NO conversational text. NO explanations. 
- Ensure all color codes are in HEX format.
- All image URLs must be high-quality placeholders if real ones aren't provided.

EXPECTED JSON STRUCTURE:
{
  "slug": "home",
  "ast_manifest": [ { "type": "HeroBanner", "props": {...} }, { "type": "ProductGrid", "props": {...} } ],
  "theme_vars": { "--accent": "#C5A059" }
}
`;

export const handleForgeGeneration = async (userPrompt: string): Promise<{ aiJson: AIStoreJson, builderPayload: any }> => {
  try {
    // 1. Get current session for merchant_id
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) throw new Error("Unauthorized: No active session found.");
    
    // Fallback or explicit mapping can be done based on your auth schema. 
    // Assuming user ID maps to merchant ID for this context.
    const merchantId = session.user.id;

    // 2. AI CALL (Using Groq API over standard fetch as per project rules)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2, // Slightly deterministic for strict JSON adherence
      })
    });

    if (!response.ok) {
      throw new Error(`AI Generation API failed: ${response.statusText}`);
    }

    const aiData = await response.json();
    const aiText = aiData.choices[0]?.message?.content || '';

    // 3. JSON EXTRACTION
    // Match the first valid { ... } block to handle AI conversational wrapper
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI layout was malformed. Retrying...");
    }

    let aiJson: AIStoreJson;
    try {
      aiJson = JSON.parse(jsonMatch[0]) as AIStoreJson;
    } catch (parseError) {
      throw new Error("AI layout was malformed. Retrying...");
    }

    if (!aiJson.ast_manifest || !Array.isArray(aiJson.ast_manifest)) {
      throw new Error("Invalid output: ast_manifest is missing or not an array.");
    }

    // 4. DATABASE INJECTION (The Upsert)
    const { error: dbError } = await supabase
      .from('store_pages')
      .upsert({
        merchant_id: merchantId,
        slug: aiJson.slug || 'home',
        ast_manifest: aiJson.ast_manifest,
        theme_vars: aiJson.theme_vars,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'merchant_id, slug' });

    if (dbError) {
      throw new Error(`Database injection failed: ${dbError.message}`);
    }

    // 5. CANVAS SYNC: Prepare payload for injectAST so the UI instantly re-renders
    const nodes: Record<string, any> = {};
    const layout: string[] = [];
    
    aiJson.ast_manifest.forEach((block, index) => {
        const id = `node_${block.type.toLowerCase()}_${Date.now()}_${index}`;
        nodes[id] = {
            id,
            type: block.type,
            parentId: null,
            children: [],
            props: block.props || {},
            styles: {},
            schemaVersion: 2,
            revision: 1
        };
        layout.push(id);
    });

    const builderPayload = {
        nodes,
        pageLayouts: { [aiJson.slug || 'home']: layout },
        activePageId: aiJson.slug || 'home',
        designSystem: { theme_vars: aiJson.theme_vars, lastUpdated: new Date().toISOString() }
    };

    return { aiJson, builderPayload };

  } catch (error: any) {
    console.error("[Omnora Forge Error]", error);
    throw error;
  }
};
