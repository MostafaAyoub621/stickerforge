
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { DesignStyle, ProductTarget, ListingMetadata, TextPosition, TrendingIdea } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async shrinkImage(base64: string, maxDim: number = 256): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Reduced quality and size to prevent 500 Rpc errors
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }

  private extractText(response: GenerateContentResponse): string {
    try {
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts) return "";
      return candidate.content.parts.map(p => p.text || "").join("").trim();
    } catch (e) {
      return "";
    }
  }

  async fetchTrendingIdeas(): Promise<TrendingIdea[]> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate 5 trending, high-conversion design ideas for Print on Demand platforms (Redbubble, Etsy, Amazon Merch, TeePublic). Each idea should target a specific profitable niche. Include a catchy title, the niche name, a brief explanation of its popularity, and a detailed descriptive prompt for an AI image generator to create a professional sticker/logo for it. Return as JSON array.",
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
      const text = this.extractText(response);
      return text ? JSON.parse(text) : [];
    } catch (e) {
      console.error("Failed to fetch trends:", e);
      return [];
    }
  }

  async suggestIdentity(prompt: string, imageBase64?: string): Promise<{ brand: string; tagline: string }> {
    const ai = this.getAI();
    try {
      let contents: any[] = [];
      if (imageBase64) {
        const smallImg = await this.shrinkImage(imageBase64);
        contents.push({ inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } });
      }
      contents.push({ text: `Based on this design concept "${prompt || 'modern design'}", suggest a professional brand name and a short catchy tagline for a logo. Return JSON.` });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: contents },
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
      const text = this.extractText(response);
      return text ? JSON.parse(text) : { brand: "StickerForge", tagline: "Design Reimagined" };
    } catch (e) {
      return { brand: "Design Forge", tagline: "Your Vision, Realized" };
    }
  }

  async suggestPrompts(currentPrompt: string): Promise<string[]> {
    if (!currentPrompt || currentPrompt.trim().length < 2) {
      return ["Minimalist mascot", "Retro vaporwave badge", "Geometric icon"];
    }
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the design idea "${currentPrompt}", provide 3 creative, high-conversion logo prompt variations that include descriptive keywords. Return ONLY a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const text = this.extractText(response);
      return text ? JSON.parse(text) : ["Cyberpunk badge", "Abstract monogram", "Retro line art"];
    } catch (e) {
      return ["Modern geometric logo", "Vintage badge icon", "Minimalist vector art"];
    }
  }

  async generateListingMetadata(asset: { prompt: string; style: string; target: string; brand: string }): Promise<ListingMetadata> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a world-class SEO expert for Print on Demand (POD). Generate a high-performing product listing for: 
        Brand: "${asset.brand}"
        Design: "${asset.prompt}"
        Aesthetic: ${asset.style}
        Targeting: ${asset.target}
        
        Provide:
        1. A click-worthy Marketplace Title.
        2. A keyword-rich Description with features and benefits.
        3. Exactly 50 powerful SEO tags as a JSON array (include long-tail, niche, and trending terms).
        
        Return JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of exactly 50 SEO tags" }
            },
            required: ["title", "description", "tags"]
          }
        }
      });
      const text = this.extractText(response);
      return text ? JSON.parse(text) : { title: asset.brand || "New Design", description: asset.prompt, tags: [] };
    } catch (e) {
      return { title: asset.brand || "New Design", description: asset.prompt, tags: [] };
    }
  }

  async vectorizeImage(base64Image: string): Promise<string[]> {
    const ai = this.getAI();
    try {
      const smallImg = await this.shrinkImage(base64Image);
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } },
            { text: "Extract the primary vector shapes of this design as a JSON array of SVG path 'd' strings. Simplified for UI rendering." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const text = this.extractText(response);
      return text ? JSON.parse(text) : [];
    } catch (e: any) {
      return ["M 256 128 L 384 384 L 128 384 Z"];
    }
  }

  async generateLogo(params: {
    prompt: string;
    style: DesignStyle;
    target: ProductTarget;
    brandName: string;
    logoText?: string;
    fontFamily?: string;
    fontSize?: number;
    textColor?: string;
    mergeTextWithStyle: boolean;
    textPosition: TextPosition;
    imageInput?: string;
    complexity: 'simple' | 'balanced' | 'detailed';
    palette: string;
    aspectRatio: "1:1" | "4:3" | "16:9";
  }): Promise<{ imageUrl: string; description: string }> {
    const ai = this.getAI();
    const model = 'gemini-2.5-flash-image';
    
    let textInstruction = "";
    if (params.logoText) {
      // EXTREME clarity to prevent metadata rendering
      textInstruction = `IMPORTANT: Your design MUST prominently feature the literal text "${params.logoText}". 
      Text Aesthetic: Use a font style like "${params.fontFamily || "Inter"}". 
      Text Color: The visible characters must be in the color ${params.textColor || "black"}. 
      WARNING: NEVER render hex codes (like "${params.textColor}"), font names (like "${params.fontFamily}"), or "Size ${params.fontSize}" as text. ONLY render the exact string: "${params.logoText}". 
      Position: ${params.textPosition}. Size factor: ${params.fontSize || 32}.`;
    }

    const targetDescription = params.target === ProductTarget.NONE 
      ? 'standalone professional graphic' 
      : `professional design optimized for ${params.target}`;

    const fullPrompt = `Task: Create a professional high-quality ${params.style} ${targetDescription}. 
    Subject: ${params.prompt}. 
    Style requirements: Flat vector, solid colors, sharp clean edges, pure white background, no gradients, no photographic shadows.
    Text requirements: ${textInstruction}
    Output: A single isolated badge or logo.`;

    try {
      const parts: any[] = [];
      
      // If image input exists, we place it as the first part to help model ground its generation
      if (params.imageInput) {
        const smallImg = await this.shrinkImage(params.imageInput);
        parts.push({ 
          inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } 
        });
        parts.push({ text: "Use the structure and layout of the attached image as a TEMPLATE. Keep the shapes but apply the new style and text provided in the instructions." });
      }
      
      parts.push({ text: fullPrompt });

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: params.aspectRatio } }
      });

      let imageUrl = "";
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (!imageUrl) throw new Error("No image was generated. Please try a different style or prompt.");
      return { imageUrl, description: this.extractText(response) || "Generated Design" };
    } catch (e: any) {
      console.error("Gemini Image Gen Error:", e);
      // Fallback for 500/Rpc errors often means payload was too large or internal failure
      if (e.message?.includes('xhr error') || e.message?.includes('500')) {
        throw new Error("Design engine encountered a payload error. Try using a smaller reference image or a simpler prompt.");
      }
      throw new Error(e.message || "Image generation failed. This could be due to safety filters or service load.");
    }
  }

  async removeBackground(base64Image: string): Promise<string> {
    const ai = this.getAI();
    try {
      const smallImg = await this.shrinkImage(base64Image);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } },
            { text: "Background Removal Task: Detect the primary design element and isolate it perfectly on a PURE BRIGHT WHITE (#FFFFFF) background. Remove all noise, shadows, and secondary backgrounds." }
          ]
        },
      });
      let imageUrl = "";
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      if (!imageUrl) throw new Error("Background removal failed. Please ensure the subject is clear.");
      return imageUrl;
    } catch (e: any) {
      throw e;
    }
  }

  async editLogo(base64Image: string, editPrompt: string): Promise<string> {
    const ai = this.getAI();
    try {
      const smallImg = await this.shrinkImage(base64Image);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } },
            { text: `Transformation Task: Maintain the foundation of this design but apply these specific edits: ${editPrompt}. Respect the existing composition while changing elements.` }
          ]
        },
      });
      let imageUrl = "";
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      if (!imageUrl) throw new Error("Image iteration failed.");
      return imageUrl;
    } catch (e: any) {
      throw e;
    }
  }
}

export const gemini = new GeminiService();
