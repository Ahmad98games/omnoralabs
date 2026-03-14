import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export interface CopilotAction {
    action: 'addNode' | 'updateNode' | 'removeNode' | 'updateProps' | 'updateStyle';
    type?: string;
    id?: string;
    props?: Record<string, any>;
}

export interface Theme {
    primaryColor: string;
    backgroundColor: string;
    cardColor: string;
    textColor: string;
    borderRadius: string;
}

export class LocalAIEngine {
    private static instance: LocalAIEngine;
    private engine: MLCEngine | null = null;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): LocalAIEngine {
        if (!LocalAIEngine.instance) {
            LocalAIEngine.instance = new LocalAIEngine();
        }
        return LocalAIEngine.instance;
    }

    /**
     * Checks if the browser is Chromium-based. Excludes Safari & Firefox.
     */
    private isChromiumBrowser(): boolean {
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = /chrome|chromium|crios/i.test(userAgent);
        const isEdge = /edg/i.test(userAgent);
        const isBrave = (navigator as any).brave !== undefined;
        // Safari check: 'safari' exists in Chrome UA, so we exclude if 'chrome' is absent or if it's Firefox
        const isFirefox = /firefox|fxios/i.test(userAgent);
        const isSafari = /safari/i.test(userAgent) && !/chrome|chromium|crios/i.test(userAgent);

        if (isFirefox || isSafari) return false;
        
        return isChrome || isEdge || isBrave;
    }

    /**
     * Initializes the WebGPU LLM Engine in the browser.
     * @param onProgress Callback to track the model downloading status
     */
    public async init(onProgress: (progress: InitProgressReport) => void): Promise<void> {
        if (this.isInitialized && this.engine) return;

        if (!(navigator as any).gpu || !this.isChromiumBrowser()) {
            throw new Error("Omnora Copilot requires a Chromium-based browser (Google Chrome, Brave, or Edge).");
        }

        try {
            // Optimized lightweight model for local tab rendering without OOM crashes
            const selectedModel = 'Phi-3-mini-4k-instruct-q4f16_1-MLC'; 
            
            this.engine = await CreateMLCEngine(selectedModel, {
                initProgressCallback: onProgress
            });
            
            this.isInitialized = true;
        } catch (error: any) {
            console.error("Failed to initialize WebLLM engine:", error);
            throw new Error(`WebLLM Initialization Failed: ${error.message}`);
        }
    }

    /**
     * Generates dispatch actions based on the user's prompt and current lightweight state.
     */
    public async generateAction(prompt: string, currentState: any): Promise<CopilotAction[]> {
        if (!this.engine || !this.isInitialized) {
            throw new Error("Local AI Engine is not initialized.");
        }

        const systemPrompt = `You are the "Omnora Design Copilot", an expert in dark, cinematic, and cyberpunk UI layouts.
You will be provided with a physical prompt to build a layout.
You MUST respond ONLY with a JSON array representing builder actions. Provide NO conversational text and NO explanations outside the JSON array.

State: ${JSON.stringify(currentState)}

Actions:
- { "action": "addNode", "type": "HeroBanner" | "Grid" | "Text" | "Image", "props": { ... } }
- { "action": "updateNode", "id": "uuid", "props": { ... } }
- { "action": "removeNode", "id": "uuid" }

Return exactly a JSON array like:
[
  { "action": "addNode", "type": "HeroBanner", "props": { "theme": "dark_cinematic" } }
]`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: prompt }
        ];

        let response: any;
        try {
            response = await this.engine.chat.completions.create({
                messages,
                temperature: 0.1, // Highly deterministic
            });

            const reply = response.choices[0]?.message.content || '[]';
            
            // Robust Regex Extraction: Find everything from the first `[` to the last `]`
            const jsonMatch = reply.match(/\[[\s\S]*\]/);
            
            if (!jsonMatch) {
                throw new Error("No JSON array format detected in model response.");
            }
            
            const cleanJSON = jsonMatch[0];
            const parsed = JSON.parse(cleanJSON);
            
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e: any) {
            console.error("Failed to parse AI Copilot payload:", e, response?.choices[0]?.message?.content);
            throw new Error("The Copilot returned an invalid format. Please try again.");
        }
    }

    /**
     * Analyzes standard e-commerce dashboard JSON metrics and returns conversational actionable tips.
     * Unlike generateAction, this is not constrained to strict JSON arrays.
     */
    public async analyzeData(dataPayload: any): Promise<string> {
        if (!this.engine || !this.isInitialized) {
            throw new Error("Local AI Engine is not initialized. Please click the generate button first.");
        }

        const systemPrompt = `You are an expert e-commerce analyst. Review this sales data and provide 2 short, actionable tips to increase revenue based strictly on this information. Be concise, cinematic, and professional.

Sales Data:
${JSON.stringify(dataPayload)}`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: "Analyze my store's performance." }
        ];

        try {
            const response = await this.engine.chat.completions.create({
                messages,
                temperature: 0.4, // Slightly higher for varied natural language
            });

            return response.choices[0]?.message.content || "No insights could be generated.";
        } catch (e: any) {
            console.error("Failed to generate AI insights:", e);
            throw new Error("The Copilot Analyst failed to interpret the data.");
        }
    }

    // Duplicate generateTheme removed

    /**
     * Generates cinematic, high-converting store content (Hero text, product descriptions).
     * Implements Regex JSON Extraction to defend against Markdown wrappers and conversational filler output by local LLMs.
     */
    public async generateContent(brandDescription: string): Promise<{ heroHeadline: string, heroSubtext: string, featuredProducts: any[] }> {
        if (!this.engine || !this.isInitialized) {
            throw new Error("Local AI Engine is not initialized.");
        }

        const systemPrompt = `You are the "Omnora Content Copilot", an elite copywriter specializing in dark, cinematic, cyberpunk, and ethereal luxury aesthetics.
You will be provided with a brand description.
Your task is to generate premium, high-converting website content that perfectly matches this aesthetic.

You MUST respond ONLY with a raw JSON object. Provide NO conversational text, NO markdown formatting, and NO explanations.

Format the JSON exactly like this:
{
  "heroHeadline": "A catchy, premium, high-impact headline (max 8 words)",
  "heroSubtext": "An ethereal, high-contrast, compelling brand description (max 20 words)",
  "featuredProducts": [
    {
      "name": "Product Name 1",
      "description": "Short cinematic description 1"
    },
    {
      "name": "Product Name 2",
      "description": "Short cinematic description 2"
    },
    {
      "name": "Product Name 3",
      "description": "Short cinematic description 3"
    }
  ]
}`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: `Generate content for this brand: ${brandDescription}` }
        ];

        try {
            const response = await this.engine.chat.completions.create({
                messages,
                temperature: 0.7, // Allow for creative copy
            });

            const rawContent = response.choices[0].message.content;
            if (!rawContent) {
                throw new Error("AI returned no content.");
            }

            // Phase 32: The Local AI JSON Trap - Regex Extractor
            // WebGPU models frequently hallucinate markdown wrappers like \`\`\`json \`\`\`
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.error("Failed to extract JSON. Raw Output:", rawContent);
                throw new Error("AI output was not formatted as valid JSON.");
            }

            const cleanJsonString = jsonMatch[0];
            const parsedContent = JSON.parse(cleanJsonString);

            // Basic validation
            if (!parsedContent.heroHeadline || !parsedContent.featuredProducts) {
                throw new Error("Parsed JSON is missing required fields.");
            }

            return parsedContent;
        } catch (error: any) {
            console.error("Content generation failed:", error);
            throw new Error(`Content Generation Error: ${error.message}`);
        }
    }

    /**
     * Phase 35: The AI Global Theming Engine
     * Generates a complete set of visual Design Tokens (theme) based on a vibe description.
     */
    public async generateTheme(vibeDescription: string): Promise<Theme> {
        if (!this.engine || !this.isInitialized) {
            throw new Error("Local AI Engine is not initialized.");
        }

        const systemPrompt = `You are the "Omnora Theme Copilot", an elite UI/UX designer specializing in dark, cinematic, cyberpunk, and minimalist aesthetics.
You will be provided with a vibe description.
Your task is to generate a premium global theme (colors and border styles) that perfectly matches this aesthetic.
CRITICAL: Ensure that 'textColor' strongly contrasts with 'backgroundColor' and 'cardColor' so the text is easily readable.

You MUST respond ONLY with a raw JSON object. Provide NO conversational text, NO markdown formatting (e.g., no \`\`\`json), and NO explanations.

Format the JSON exactly like this:
{
  "primaryColor": "#HEXCODE",
  "backgroundColor": "#HEXCODE",
  "cardColor": "#HEXCODE",
  "textColor": "#HEXCODE",
  "borderRadius": "0px"
}`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: `Generate a theme for this vibe: ${vibeDescription}` }
        ];

        try {
            const response = await this.engine.chat.completions.create({
                messages,
                temperature: 0.6, // Slight creativity for aesthetic nuance
            });

            const rawContent = response.choices[0].message.content;
            if (!rawContent) {
                throw new Error("AI returned no theme data.");
            }

            // Regex JSON Extractor to violently strip out markdown wrappers
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.error("Failed to extract JSON wrapper. Raw Output:", rawContent);
                throw new Error("AI output was not formatted as a pure JSON object.");
            }

            const cleanJsonString = jsonMatch[0];
            const parsedTheme = JSON.parse(cleanJsonString);

            // Structure validation
            if (!parsedTheme.primaryColor || !parsedTheme.backgroundColor || !parsedTheme.cardColor || !parsedTheme.textColor || !parsedTheme.borderRadius) {
                throw new Error("Parsed theme JSON is missing necessary token fields.");
            }

            return parsedTheme;
        } catch (error: any) {
            console.error("Theme generation failed:", error);
            throw new Error(`Theme Generation Error: ${error.message}`);
        }
    }
}

export const localAIEngine = LocalAIEngine.getInstance();
