import { supabase } from '../../lib/supabaseClient';

export interface ForgeBlock {
    type: string;
    props: Record<string, unknown>;
}

export interface AIStoreJson {
  slug: string;
  ast_manifest: ForgeBlock[];
  theme_vars: Record<string, string>;
}

export interface BuilderPayload {
    nodes: Record<string, unknown>;
    pageLayouts: Record<string, string[]>;
    activePageId: string;
    designSystem: {
        theme_vars: Record<string, string>;
        lastUpdated: string;
    };
}

const SYSTEM_PROMPT = `
ACT AS A WORLD-CLASS E-COMMERCE CONVERSION EXPERT AND A $10k/mo AGENCY DESIGNER.

GOAL: Generate a high-converting, production-ready store manifest that drives sales.

COPYWRITING ENGINE (Magnetic Headlines):
- ABSOLUTELY NO generic headlines (e.g., "Welcome", "Sneaker Store").
- Use MAGNETIC, BENEFIT-DRIVEN HEADLINES. Speak to target customer desires or local identity (e.g., "Elevate Your Street Cred: Karachi's Most Exclusive Drops", "Timeless Precision: Invest in Legacy").
- Subtitles must bridge to trust and local accessibility (e.g., "Authentic Jordan 1s & Yeezys. Shipped fast from local stock").

AUTOMATIC TRUST BUILDING:
- Every store MUST have a 'TrustBadges' element placed directly below the Hero or Grid.
- Provide exactly 3 hyper-local benefits with matching icons (e.g., "Cash on Delivery", "24/7 Support", "100% Authenticity Guarantee", "Instant Local Shipping").

AVAILABLE COMPONENT LIBRARY (Use only these):
- HeroBanner: { title: string, subtitle: string, bgImage: string, cta: string }
- ProductGrid: { desktopColumns: number, category: string, gridGap: number }
- WhatsAppFloating: { phoneNumber: string, welcomeMessage: string, position: 'left'|'right' }
- TrustBadges: { items: Array<{icon: string, label: string}> }
- FAQ: { questions: Array<{q: string, a: string}> }

THE WHATSAPP CONVERSION BRIDGE:
- 'phoneNumber': Must be a valid international format (e.g., "+923001234567").
- 'welcomeMessage': MUST BE NICHE-SPECIFIC to lower decision friction (e.g., "Yo! I saw the Retro drops on Omnora, do you have sizes in Karachi stock?").

THEME INTELLIGENCE:
- 'theme_vars' MUST support high-contrast accessibility (Contrast ratio > 4.5:1).
- Include depth scaling variables:
  - "--primary": Core branding color (HEX).
  - "--accent": CTA attention-grabber color (HEX).
  - "--surface-color": Premium background depth offset (HEX).
  - "--text-muted": Subtext/Subtitle readability level (HEX).

STRICT OUTPUT RULES:
- Output ONLY valid JSON. No conversational wrapper or noise.
- All image URLs can use premium stock defaults if specifics aren't specified.

EXPECTED JSON STRUCTURE:
{
  "slug": "home",
  "ast_manifest": [ { "type": "HeroBanner", "props": {...} }, { "type": "TrustBadges", "props": {...} } ],
  "theme_vars": {
    "--primary": "#0A0A0A",
    "--accent": "#FF4500",
    "--surface-color": "#1A1A1A",
    "--text-muted": "#7B7B7B"
  }
}
`;

export const handleForgeGeneration = async (userPrompt: string): Promise<{ aiJson: AIStoreJson, builderPayload: BuilderPayload }> => {
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
    } catch {
      throw new Error("AI layout was malformed. Retrying...");
    }

    if (!aiJson.ast_manifest || !Array.isArray(aiJson.ast_manifest)) {
      throw new Error("Invalid output: ast_manifest is missing or not an array.");
    }

    if (!aiJson.theme_vars || typeof aiJson.theme_vars !== 'object') {
      throw new Error("Invalid output: theme_vars is missing or not an object.");
    }

    // 4. DATABASE INJECTION (The Upsert)
    const { error: dbError } = await supabase
      .from('store_pages')
      .upsert({
        merchant_id: merchantId,
        slug: aiJson.slug || 'home',
        ast_manifest: aiJson.ast_manifest,
        theme_vars: aiJson.theme_vars,
        is_published: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'merchant_id, slug' });

    if (dbError) {
      throw new Error(`Database injection failed: ${dbError.message}`);
    }

    // 5. CANVAS SYNC: Prepare payload for injectAST so the UI instantly re-renders
    const nodes: Record<string, unknown> = {};
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

    const builderPayload: BuilderPayload = {
        nodes,
        pageLayouts: { [aiJson.slug || 'home']: layout },
        activePageId: aiJson.slug || 'home',
        designSystem: { theme_vars: aiJson.theme_vars, lastUpdated: new Date().toISOString() }
    };

    return { aiJson, builderPayload };

  } catch (error: unknown) {
    console.error("[Omnora Forge Error]", error);
    throw error;
  }
};

import { useBuilder } from '../../context/BuilderContext';
import { toast } from 'react-hot-toast';

export const useForgeController = () => {
    const builderContext = useBuilder();

    const forge = async (userPrompt: string): Promise<boolean> => {
        try {
            const { builderPayload } = await handleForgeGeneration(userPrompt);
            
            if (builderContext?.injectAST) {
                builderContext.injectAST(builderPayload);
                return true;
            } else {
                console.error("Builder context not found or injectAST missing");
                return false;
            }
        } catch (err: unknown) {
            console.error("[useForgeController error]", err);
            const message = (err as Error).message || "Forge failed";
            if (message.includes('malformed') || message.includes('JSON')) {
                toast.error("AI Logic error. Retrying with a cleaner prompt...");
            } else {
                toast.error(err.message || "Forge failed");
            }
            return false;
        }
    };

    const publish = async (slug: string): Promise<{ success: boolean; url?: string; error?: string }> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) throw new Error("User not authenticated");

            // 1. Fetch Merchant Slug
            const { data: merchant, error: mError } = await supabase
                .from('merchants')
                .select('slug')
                .eq('id', userId)
                .single();

            if (mError) throw new Error(`Merchant lookup failed: ${mError.message}`);
            const merchant_slug = merchant?.slug || 'store';

            // 2. Update status
            const { error } = await supabase
                .from('store_pages')
                .update({ is_published: true })
                .eq('slug', slug)
                .eq('merchant_id', userId);

            if (error) throw error;

            const url = `${window.location.origin}/store/${merchant_slug}/${slug === 'home' ? '' : slug}`;
            return { success: true, url };
        } catch (err: unknown) {
            console.error("Publish failed:", err);
            const message = (err as Error).message || "Publish failed";
            toast.error(message);
            return { success: false, error: message };
        }
    };

    return { forge, publish };
};
