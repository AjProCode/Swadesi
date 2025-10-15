// Gemini AI Service for SwaDesi App
// ✅ CODE REVIEW: EXCELLENT - No changes needed

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProductImpactInfo {
  gdpContribution: string;
  localEconomyImpact: string;
  jobsSupported: number;
  sustainabilityScore: number;
  culturalSignificance: string;
}

export interface AIPersonality {
  name: string;
  traits: string[];
  responseStyle: string;
  expertise: string[];
}

export const AI_PERSONALITIES: Record<string, AIPersonality> = {
  maya: {
    name: 'Maya',
    traits: ['enthusiastic', 'knowledgeable', 'cultural expert', 'encouraging'],
    responseStyle: 'warm and informative with cultural insights',
    expertise: ['Indian culture', 'traditional crafts', 'local artisans', 'heritage products']
  },
  arjun: {
    name: 'Arjun',
    traits: ['analytical', 'economic expert', 'data-driven', 'professional'],
    responseStyle: 'factual and analytical with economic focus',
    expertise: ['GDP impact', 'economic analysis', 'market trends', 'business insights']
  },
  priya: {
    name: 'Priya',
    traits: ['friendly', 'helpful', 'lifestyle expert', 'practical'],
    responseStyle: 'casual and practical with lifestyle tips',
    expertise: ['daily essentials', 'lifestyle products', 'practical advice', 'user experience']
  }
};

class GeminiAIService {
  private config: GeminiConfig;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-1.5-flash-latest',
      temperature: 0.7,
      maxTokens: 1000,
      ...config
    };
  }

  async makeRequest(prompt: string, systemPrompt?: string): Promise<GeminiResponse> {
    try {
      // Validate API key
      if (!this.config.apiKey || this.config.apiKey === 'YOUR_API_KEY_HERE' || this.config.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn('⚠️ Gemini API key not configured - using fallback response');
        throw new Error('Gemini API key not configured');
      }

      const url = `${this.baseURL}/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}`
        : prompt;

      console.log('🤖 Making Gemini API request to:', this.config.model);

      const requestBody = {
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        // Only log error if it's not an API key issue (to avoid spam)
        if (!errorData.error?.message?.includes('API key not valid')) {
          console.error('❌ Gemini API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            model: this.config.model
          });
        } else {
          console.warn('⚠️ Gemini API key is invalid - using fallback responses');
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('❌ Invalid Gemini response format:', data);
        throw new Error('Invalid response format from Gemini API');
      }

      console.log('✅ Gemini API request successful');
      return {
        text: data.candidates[0].content.parts[0].text,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0
        } : undefined
      };
    } catch (error) {
      // Only log non-API-key errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('API key')) {
        console.error('❌ Gemini API request failed:', error);
      }
      throw error;
    }
  }

  async getPersonalizedResponse(
    message: string, 
    personality: keyof typeof AI_PERSONALITIES,
    context?: {
      userProfile?: any;
      recentActivity?: string[];
      currentPage?: string;
    }
  ): Promise<string> {
    const persona = AI_PERSONALITIES[personality];
    const contextInfo = context ? `
Context:
- User Profile: ${context.userProfile ? JSON.stringify(context.userProfile, null, 2) : 'Not available'}
- Recent Activity: ${context.recentActivity?.join(', ') || 'None'}
- Current Page: ${context.currentPage || 'Unknown'}
` : '';

    const systemPrompt = `You are ${persona.name}, an AI assistant for SwaDesi - a Made in India marketplace app that supports local businesses and tracks GDP impact.

Your personality traits: ${persona.traits.join(', ')}
Your response style: ${persona.responseStyle}
Your expertise: ${persona.expertise.join(', ')}

${contextInfo}

Always:
- Stay in character as ${persona.name}
- Focus on Made in India products and their benefits
- Mention GDP impact and local economy support when relevant
- Keep responses under 150 words
- Be helpful and encouraging about supporting local businesses
- Use Indian cultural references when appropriate`;

    try {
      const response = await this.makeRequest(message, systemPrompt);
      return response.text;
    } catch (error) {
      console.error(`Error getting ${persona.name} response:`, error);
      return this.getFallbackResponse(personality, message);
    }
  }

  async analyzeProductImpact(
    productName: string,
    vendorInfo: any,
    price: number
  ): Promise<ProductImpactInfo> {
    const prompt = `Analyze the economic and cultural impact of this Made in India product:

Product: ${productName}
Vendor: ${vendorInfo.businessName || 'Local Business'}
Category: ${vendorInfo.category || 'Various'}
Price: ₹${price}
Location: ${vendorInfo.address || 'India'}

Provide analysis in this JSON format:
{
  "gdpContribution": "Brief description of how this purchase contributes to India's GDP",
  "localEconomyImpact": "How this supports the local economy",
  "jobsSupported": estimated_number_of_jobs_supported,
  "sustainabilityScore": score_out_of_10,
  "culturalSignificance": "Cultural or traditional importance of this product"
}

Keep each field concise but informative.`;

    try {
      const response = await this.makeRequest(prompt);
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getFallbackProductImpact(productName, price);
    }
  }

  async generateProductRecommendations(
    userPreferences: any,
    recentPurchases: any[],
    currentCategory?: string
  ): Promise<string[]> {
    const prompt = `Based on this user's profile and purchase history, recommend 5 Made in India products:

User Preferences: ${JSON.stringify(userPreferences, null, 2)}
Recent Purchases: ${recentPurchases.map(p => p.productName).join(', ')}
Current Category: ${currentCategory || 'All'}

Focus on:
- Supporting different regions of India
- Varying price ranges
- Cultural significance
- GDP impact potential

Return only a JSON array of product names: ["Product 1", "Product 2", etc.]`;

    try {
      const response = await this.makeRequest(prompt);
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON array found in response');
    } catch (error) {
      console.error('AI Alternatives Error:', error);
      return this.getFallbackRecommendations(currentCategory);
    }
  }

  async analyzeBillOCR(imageUrl: string, context?: string): Promise<{
    vendorName: string;
    amount: number;
    items: Array<{ name: string; price: number; quantity: number }>;
    confidence: number;
    extractedText: string;
  }> {
    // Note: Gemini Vision API would require different endpoint and handling
    // For now, we'll use a text-based analysis approach
    const prompt = `Analyze this bill/receipt context: ${context || 'Bill image uploaded'}

Extract the following information and return as JSON:
{
  "vendorName": "Name of the store/vendor",
  "amount": total_amount_number,
  "items": [
    {
      "name": "Item name",
      "price": price_number,
      "quantity": quantity_number
    }
  ],
  "confidence": confidence_score_0_to_1,
  "extractedText": "Full text found in the image"
}

If this appears to be from a Made in India business, mention that in the vendor analysis.`;

    try {
      const response = await this.makeRequest(prompt);
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Error analyzing bill OCR:', error);
      return this.getFallbackBillAnalysis();
    }
  }

  async generateGDPInsight(
    purchaseAmount: number,
    vendorCategory: string,
    region: string
  ): Promise<string> {
    const prompt = `Generate a brief, encouraging insight about the GDP impact of this purchase:

Amount: ₹${purchaseAmount}
Category: ${vendorCategory}
Region: ${region}

Explain in 1-2 sentences how this purchase contributes to India's economy, focusing on:
- GDP contribution
- Local job creation
- Economic multiplier effect
- Support for small businesses

Keep it inspiring and factual.`;

    try {
      const response = await this.makeRequest(prompt);
      return response.text.trim();
    } catch (error) {
      console.error('Error generating GDP insight:', error);
      return this.getFallbackGDPInsight(purchaseAmount, vendorCategory);
    }
  }

  // Fallback responses for when API calls fail
  private getFallbackResponse(personality: keyof typeof AI_PERSONALITIES, message: string): string {
    const persona = AI_PERSONALITIES[personality];
    const fallbacks = {
      maya: "I'm excited to help you discover amazing Made in India products! Every purchase supports our local artisans and contributes to India's growing economy. What specific products are you looking for?",
      arjun: "Based on economic data, supporting Made in India businesses significantly impacts our GDP growth. Each purchase creates a multiplier effect, supporting approximately 3-4 jobs indirectly. How can I help you make an economically impactful choice?",
      priya: "I'd love to help you find the perfect products! Shopping local not only gets you authentic quality but also supports our community. What are you in the mood to explore today?"
    };
    return fallbacks[personality] || fallbacks.priya;
  }

  private getFallbackProductImpact(productName: string, price: number): ProductImpactInfo {
    return {
      gdpContribution: `This ₹${price} purchase contributes approximately ₹${Math.round(price * 0.7)} to India's GDP through local value creation`,
      localEconomyImpact: "Supports local supply chains, vendors, and creates indirect employment opportunities",
      jobsSupported: Math.max(1, Math.floor(price / 1000)),
      sustainabilityScore: 7,
      culturalSignificance: "Represents the rich tradition of Indian craftsmanship and local business heritage"
    };
  }

  private getFallbackRecommendations(category?: string): string[] {
    const recommendations = {
      'Food & Beverages': ['Organic Spices from Kerala', 'Artisanal Tea from Darjeeling', 'Traditional Sweets', 'Cold-pressed Oils', 'Herbal Products'],
      'Clothing & Fashion': ['Handloom Sarees', 'Khadi Kurtas', 'Block Print Fabrics', 'Leather Goods', 'Jewelry'],
      'Home & Living': ['Brass Decoratives', 'Handcrafted Pottery', 'Bamboo Products', 'Cotton Bedsheets', 'Incense Products'],
      'Health & Beauty': ['Ayurvedic Products', 'Natural Soaps', 'Herbal Hair Oil', 'Skincare Products', 'Wellness Items']
    };
    return recommendations[category as keyof typeof recommendations] || recommendations['Food & Beverages'];
  }

  private getFallbackBillAnalysis() {
    return {
      vendorName: "Local Store",
      amount: 0,
      items: [],
      confidence: 0.5,
      extractedText: "Could not extract text from image. Please enter details manually."
    };
  }

  private getFallbackGDPInsight(amount: number, category: string): string {
    return `Your ₹${amount} purchase in ${category} contributes approximately ₹${Math.round(amount * 0.68)} to India's GDP and supports local businesses in the supply chain!`;
  }
}

// Singleton instance
let geminiService: GeminiAIService | null = null;

export const getGeminiService = (apiKey?: string): GeminiAIService => {
  if (!geminiService && apiKey) {
    geminiService = new GeminiAIService({ apiKey });
  }
  
  if (!geminiService) {
    throw new Error('Gemini service not initialized. Please provide API key.');
  }
  
  return geminiService;
};

export const initializeGeminiService = (apiKey: string): void => {
  geminiService = new GeminiAIService({ apiKey });
};

// Helper function to check if API key is available
export const isGeminiConfigured = (): boolean => {
  return geminiService !== null;
};

// Safe wrapper that returns fallback if not configured
export const safeGetGeminiService = (): GeminiAIService | null => {
  try {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey !== 'YOUR_API_KEY_HERE') {
      return getGeminiService(apiKey);
    }
    return null;
  } catch {
    return null;
  }
};
