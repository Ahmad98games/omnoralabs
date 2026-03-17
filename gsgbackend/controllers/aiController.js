const axios = require('axios');

class AIController {
  /**
   * Generate Copy with Groq
   * POST /api/ai/generate-copy
   */
  static async generateCopy(req, res) {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Backend Missing GROQ_API_KEY" });
      }

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: "You are the Omnora Forge Engine. Ahmad is the Founder. Generate high-end, luxury, minimalist e-commerce copy. Tone: Aristocratic and sophisticated. Return JSON only (HeroTitle, HeroSubtitle, ProductDesc)."
          },
          {
            role: 'user',
            content: prompt || 'Generate a luxury storefront copy'
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" } // Enforce JSON if supported by standard structure
      }, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      let content = response.data.choices[0].message.content;
      
      // Parse to ensure it's JSON
      try {
        content = JSON.parse(content);
      } catch (e) {
        // Fallback or leave as string if parsing fails
      }

      return res.json({
        success: true,
        data: content
      });

    } catch (error) {
      console.error('Groq AI Error:', error.response ? error.response.data : error.message);
      return res.status(500).json({
        success: false,
        error: error.response ? error.response.data : 'AI Generation failed'
      });
    }
  }
}

module.exports = AIController;
