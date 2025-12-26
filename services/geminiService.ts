
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
        contents: "Generate 5 trending, high-conversion design ideas for Print on Demand platforms. Include a catchy title, the niche name, a brief explanation of popularity, and a detailed descriptive prompt for a sticker logo. Return as JSON array.",
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
      contents.push({ text: `Analyze this: "${prompt || 'modern logo'}". Suggest a professional brand name and tagline. Return JSON.` });

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
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on "${currentPrompt}", give 3 creative logo prompt variations. Return JSON array of strings.`,
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
    } catch (e) {
      return [];
    }
  }

  async generateListingMetadata(asset: { prompt: string; style: string; target: string; brand: string }): Promise<ListingMetadata> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `SEO optimization for: Brand "${asset.brand}", Design "${asset.prompt}". Generate Title, Description, and 50 Tags. Return JSON.`,
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
      const text = this.extractText(response);
      return text ? JSON.parse(text) : { title: asset.brand, description: asset.prompt, tags: [] };
    } catch (e) {
      return { title: asset.brand, description: asset.prompt, tags: [] };
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
            { text: "Extract SVG path 'd' strings for the main logo elements. Return JSON array." }
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
    } catch (e) {
      return [];
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
      textInstruction = `CRITICAL: Incorporate exactly the text "${params.logoText}". 
      FONT STYLE: ${params.fontFamily || "Inter"}. 
      COLOR: ${params.textColor || "black"}. 
      PLACEMENT: ${params.textPosition}. 
      STRICT WARNING: DO NOT RENDER METADATA. DO NOT write technical strings like "Hex: ${params.textColor}", "Font: ${params.fontFamily}", or "Size: ${params.fontSize}" on the design. Only render the literal content "${params.logoText}".`;
    }

    const fullPrompt = `A professional high-end ${params.style} sticker/logo design. 
    Subject: ${params.prompt}. 
    Optimized for: ${params.target}. 
    STYLE: Flat vector art, solid fill colors, sharp edges, pure white background. NO gradients, NO 3D effects, NO photographic elements. 
    ${textInstruction}`;

    try {
      const parts: any[] = [];
      if (params.imageInput) {
        const smallImg = await this.shrinkImage(params.imageInput);
        parts.push({ inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } });
        parts.push({ text: "Replicate the exact composition and layout of this reference image, but apply the style and text specified in the prompt." });
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
      
      if (!imageUrl) throw new Error("Image generation failed. Try a simpler prompt.");
      return { imageUrl, description: this.extractText(response) || "Generated Design" };
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('xhr error') || e.message?.includes('500')) {
        throw new Error("Payload too large or internal model error. Try removing or simplifying the reference image.");
      }
      throw e;
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
            { text: "PROFESSIONAL BACKGROUND REMOVAL: Isolate the main logo element perfectly. Place it on a PURE, SOLID, BRIGHT WHITE (#FFFFFF) background. Remove all noise, overlapping backgrounds, shadows, and subtle gradients outside the main subject. Ensure crisp borders." }
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
            { text: `ITERATIVE EDIT: Maintain the structure of this design but ${editPrompt}. Keep the background white and style consistent.` }
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
      return imageUrl;
    } catch (e: any) {
      throw e;
    }
  }
}

export const gemini = new GeminiService();
