
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { DesignStyle, ProductTarget, ListingMetadata, TextPosition, TrendingIdea } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async shrinkImage(base64: string, maxDim: number = 512): Promise<string> {
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
        contents: "Generate 5 trending, high-conversion design ideas for Print on Demand platforms (Redbubble, Etsy, Amazon Merch). Include a catchy title, the niche it targets, why it is popular now, and a high-quality prompt for an AI image generator to create a sticker logo for it. Return as JSON array.",
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
      console.error("Failed to fetch trends", e);
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
      contents.push({ text: `Analyze the design/concept: "${prompt || 'modern design'}". Suggest a creative brand name and a short logo tagline. Return JSON.` });

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
      return text ? JSON.parse(text) : { brand: "DesignForge", tagline: "Creative Spark" };
    } catch (e) {
      return { brand: "Forge Design", tagline: "Unleash Creativity" };
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
        contents: `Based on "${currentPrompt}", give 3 short, creative logo/sticker prompt variations. Return ONLY a JSON array of strings.`,
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
      return ["Minimalist icon", "Vintage badge", "Modern geometric logo"];
    }
  }

  async generateListingMetadata(asset: { prompt: string; style: string; target: string; brand: string }): Promise<ListingMetadata> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert SEO specialist for Print on Demand (POD) platforms like Redbubble, Etsy, Amazon Merch, and TeePublic. 
        Generate a high-converting, click-worthy title, a keyword-rich compelling description, and exactly 50 powerful, high-volume SEO tags (comma-separated list) for this product: 
        Brand: "${asset.brand}"
        Idea: "${asset.prompt}"
        Style: ${asset.style}
        Target Product: ${asset.target}
        
        Tags must include long-tail keywords, broad niche terms, and relevant trending descriptors to ensure the design is found by customers. 
        Return JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of exactly 50 viral SEO keywords" }
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
            { text: "Convert the primary shapes of this logo into a JSON array of SVG path 'd' strings. Simplified for UI rendering." }
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
      textInstruction = `Clearly incorporate the text "${params.logoText}" using ${params.fontFamily || "Inter"} font. Position: ${params.textPosition}.`;
    }

    const targetDescription = params.target === ProductTarget.NONE 
      ? 'standalone professional flat vector graphic' 
      : `professional design optimized for a ${params.target}`;

    const fullPrompt = `High-end ${params.style} ${targetDescription}. Color Palette: ${params.palette}. ${textInstruction} Clean vector iconography, solid colors, sharp edges, isolated on a white background. ${params.prompt}.`;

    try {
      let contents: any = { parts: [{ text: fullPrompt }] };
      if (params.imageInput) {
        const smallImg = await this.shrinkImage(params.imageInput);
        contents.parts.push({ 
          inlineData: { data: smallImg.split(',')[1], mimeType: 'image/jpeg' } 
        });
        contents.parts.push({ text: "STRICTLY CLONE this design's composition, shapes, and structural balance. Adapt only the style and text details as requested." });
      }
      
      const response = await ai.models.generateContent({
        model,
        contents,
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
      
      if (!imageUrl) throw new Error("Image generation failed.");
      return { imageUrl, description: this.extractText(response) || "Generated Design" };
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
            { text: editPrompt }
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
