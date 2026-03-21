import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') as string;

const SYSTEM_PROMPT = `
You are a World-Class E-commerce Growth Expert and L9 Engineer analyzing an Omnora OS store's operational data.
Analyze the provided JSON metrics. Focus intensely on Inventory, Ads ROI (CAPI Fidelity), and Subscription Health.

Return a strictly valid JSON array (no markdown block wrappers, string formatting, or preamble) matching this exact schema:
[
  {
    "title": "String - Punchy Actionable Title",
    "description": "String - Data-backed reasoning (e.g., 'You generated 50 sales but XYZ')",
    "impact_score": "Number 1-10",
    "action_type": "CREATE_COUPON | RESTOCK_ITEM | PAUSED_WARNING | GENERIC",
    "suggested_payload": { "code": "Optional string", "sku": "Optional string" }
  }
]
`;

serve(async (req) => {
    const headers = new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });

    if (req.method === 'OPTIONS') return new Response('ok', { headers });

    try {
        const { store_data } = await req.json();

        if (!store_data) {
            return new Response(JSON.stringify({ error: "No store data provided" }), { status: 400, headers });
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: `Here is the store JSON: ${JSON.stringify(store_data)}` }]
            }],
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
                temperature: 0.2, // Low bound, highly deterministic reasoning
                responseMimeType: "application/json"
            }
        };

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const geminiData = await res.json();

        if (!res.ok) {
            throw new Error(`Gemini Error: ${JSON.stringify(geminiData)}`);
        }

        // Extract native string and parse
        let responseText = geminiData.candidates[0].content.parts[0].text;
        
        // Safety Clean against edge-cases
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const insightsArray = JSON.parse(responseText);

        return new Response(JSON.stringify({ insights: insightsArray }), { status: 200, headers });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
});
