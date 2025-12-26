
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { DesignStyle, ProductTarget, ListingMetadata, TextPosition, TrendingIdea } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async shrinkImage(base64: string, maxDim: number = 384): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }

  /**
   * Complex Query Handling with Thinking Mode
   */
  async deepThink(query: string, imageBase64?: string): Promise<string> {
    const ai = this.getAI();
    const parts: any[] = [{ text: query }];
    if (imageBase64) {
      const smallImg = await this.shrinkImage(imageBase64);
      parts.push({ inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    // Use response.text directly as per guidelines
    return response.text || "I've analyzed the request, but couldn't generate a response.";
  }

  /**
   * Image Understanding using Gemini 3 Pro
   */
  async analyzeImage(base64: string): Promise<string> {
    const ai = this.getAI();
    const smallImg = await this.shrinkImage(base64);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } },
          { text: "Analyze this image in detail. Identify colors, shapes, typography styles, and core branding elements. Suggest how to adapt this into a professional sticker design." }
        ]
      }
    });
    // Use response.text directly as per guidelines
    return response.text || "Analysis complete.";
  }

  /**
   * Suggests brand identity components
   */
  async suggestIdentity(prompt: string, imageUrl?: string): Promise<{ brand: string; tagline: string }> {
    const ai = this.getAI();
    const parts: any[] = [{ text: `Based on the design concept "${prompt}", suggest a catchy brand name and a short tagline for a sticker business. Return as JSON.` }];
    if (imageUrl) {
      const smallImg = await this.shrinkImage(imageUrl);
      parts.push({ inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } });
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            tagline: { type: Type.STRING }
          },
          required: ["brand", "tagline"]
        }
      }
    });
    // Parse response.text directly
    return JSON.parse(response.text || '{"brand": "StickerForge", "tagline": "Crafting Identity"}');
  }

  /**
   * Generates optimized marketplace metadata
   */
  async generateListingMetadata(params: { prompt: string; style: string; target: string; brand: string; platform?: string }): Promise<ListingMetadata> {
    const ai = this.getAI();
    const platformCtx = params.platform ? `for ${params.platform}` : "for a POD marketplace";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate SEO-optimized listing metadata (title, description, and 13 tags) ${platformCtx} for a design with these details: 
      Prompt: ${params.prompt}, Style: ${params.style}, Product: ${params.target}, Brand: ${params.brand}. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "tags"]
        }
      }
    });
    return JSON.parse(response.text || '{"title": "", "description": "", "tags": []}');
  }

  /**
   * Suggests prompt variations based on a base concept
   */
  async suggestPrompts(prompt: string): Promise<string[]> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Given the base concept "${prompt}", suggest 5 more detailed and creative variations of this prompt for sticker designs. Return as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try {
      return JSON.parse(response.text || '[]');
    } catch {
      return [];
    }
  }

  async fetchTrendingIdeas(platform?: string): Promise<TrendingIdea[]> {
    const ai = this.getAI();
    const platformCtx = platform ? `specifically for the marketplace ${platform}` : "for general POD marketplaces like Etsy and Redbubble";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 10 trending, high-conversion design niche ideas ${platformCtx}. Return as JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                niche: { type: Type.STRING },
                reason: { type: Type.STRING },
                suggestedPrompt: { type: Type.STRING }
              },
              required: ["title", "niche", "reason", "suggestedPrompt"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  }

  async suggestFont(prompt: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the design concept "${prompt}", suggest one perfect font family name from Google Fonts. Return only the font name string.`,
    });
    return response.text?.trim() || "Inter";
  }

  async generateLogo(params: any): Promise<{ imageUrl: string; description: string }> {
    const ai = this.getAI();
    const model = 'gemini-2.5-flash-image';
    
    let textInstruction = params.logoText ? `
      TEXT: "${params.logoText}". TYPOGRAPHY: "${params.fontFamily}". COLOR: "${params.textColor}". POSITION: "${params.textPosition}".
      ONLY render the text "${params.logoText}". NO hex codes or font names.` : "";

    const fullPrompt = `A professional ${params.style} badge logo for ${params.target}. SUBJECT: ${params.prompt}. Flat clean vector, white background. ${textInstruction}`;

    const parts: any[] = [];
    if (params.imageInput) {
      const smallImg = await this.shrinkImage(params.imageInput);
      parts.push({ inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } });
      parts.push({ text: "Use the structure of this reference but transform it into the style requested." });
    }
    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: params.aspectRatio } }
    });

    let imageUrl = "";
    // Iterating parts to find image data as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return { imageUrl, description: response.text || "" };
  }

  async removeBackground(base64Image: string): Promise<string> {
    const ai = this.getAI();
    const smallImg = await this.shrinkImage(base64Image);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } },
          { text: "Remove the background. Isolate main design on pure white #FFFFFF." }
        ]
      },
    });
    let imageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  }

  async editLogo(base64Image: string, editPrompt: string): Promise<string> {
    const ai = this.getAI();
    const smallImg = await this.shrinkImage(base64Image);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Edit this design: ${editPrompt}. Maintain high vector quality.` }
        ]
      },
    });
    let imageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  }
}

export const gemini = new GeminiService();
