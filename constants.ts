
import { DesignStyle, ProductTarget, StickerMaterial, TextPosition } from './types';

export const STYLE_PRESETS = [
  { id: DesignStyle.MINIMAL, name: 'Minimalist', description: 'Clean lines' },
  { id: DesignStyle.VINTAGE, name: 'Vintage', description: 'Retro aesthetic' },
  { id: DesignStyle.MASCOT, name: 'Mascot', description: 'Character-based' },
  { id: DesignStyle.MONOGRAM, name: 'Monogram', description: 'Initial-based' },
  { id: DesignStyle.CYBERPUNK, name: 'Cyberpunk', description: 'High-tech neon' },
  { id: DesignStyle.GHIBLI, name: 'Ghibli', description: 'Whimsical anime' },
  { id: DesignStyle.PSYCHEDELIC, name: 'Psychedelic', description: 'Trippy & colorful' },
  { id: DesignStyle.ART_DECO, name: 'Art Deco', description: 'Glamorous geometric' },
  { id: DesignStyle.VAPORWAVE, name: 'Vaporwave', description: '90s nostalgia' },
  { id: DesignStyle.LINE_ART, name: 'Line Art', description: 'Contour focused' },
  { id: DesignStyle.BRUTALIST, name: 'Brutalist', description: 'Raw & bold' },
  { id: DesignStyle.KAWAII, name: 'Kawaii', description: 'Cute & playful' },
  { id: DesignStyle.ISOMETRIC, name: 'Isometric', description: '3D perspective' },
  { id: DesignStyle.GRAFFITI, name: 'Graffiti', description: 'Urban street art' },
  { id: DesignStyle.CLAYMORPHISM, name: 'Clay', description: 'Soft 3D shapes' },
  { id: DesignStyle.WATERCOLOR, name: 'Watercolor', description: 'Hand-painted' },
  { id: DesignStyle.GLASSMORPHISM, name: 'Glass', description: 'Frosted transparency' },
  { id: DesignStyle.RETRO_FUTURISM, name: 'RetroFuture', description: 'Space age style' },
  { id: DesignStyle.ORIGAMI, name: 'Origami', description: 'Folded paper look' },
];

export const FONT_PRESETS = [
  "Inter", "JetBrains Mono", "Montserrat", "Playfair Display", "Bebas Neue", "Lobster", "Space Grotesk", "Cormorant Garamond"
];

export const TEXT_POSITIONS = [
  { id: TextPosition.OVERLAY, name: 'Overlay', icon: '🔲' },
  { id: TextPosition.BELOW, name: 'Below Design', icon: '⬇️' },
  { id: TextPosition.INTEGRATED, name: 'Integrated', icon: '🧬' },
];

export const MARKETPLACE_PRESETS = [
  { id: 'PRINTFUL', name: 'Printful (300DPI)', dims: '3000x3000px', format: 'PNG' },
  { id: 'REDBUBBLE', name: 'Redbubble (High)', dims: '2400x2400px', format: 'PNG' },
  { id: 'ETSY', name: 'Etsy Listing', dims: '2000x2000px', format: 'JPG' },
  { id: 'PRINTIFY', name: 'Printify Sticker', dims: '2800x2800px', format: 'PNG' }
];

export const PRODUCT_CATEGORIES = [
  {
    name: 'General',
    items: [
      { id: ProductTarget.NONE, name: 'Design Only (No Mockup)', icon: '🖼️' },
    ]
  },
  {
    name: 'Clothing',
    items: [
      { id: ProductTarget.TSHIRT, name: 'T-Shirts & Tops', icon: '👕' },
      { id: ProductTarget.OVERSIZED_TSHIRT, name: 'Oversized T-Shirts', icon: '👚' },
      { id: ProductTarget.DRESS, name: 'Dresses', icon: '👗' },
    ]
  },
  {
    name: 'Accessories',
    items: [
      { id: ProductTarget.BUCKET_HAT, name: 'Bucket Hats', icon: '👒' },
      { id: ProductTarget.TOTE_BAG, name: 'Tote Bags', icon: '👜' },
      { id: ProductTarget.PHONE_CASE, name: 'Phone Cases', icon: '📱' },
    ]
  },
  {
    name: 'Office & Gear',
    items: [
      { id: 'laptop' as any, name: 'Laptop Lid', icon: '💻' },
      { id: 'bottle' as any, name: 'Water Bottle', icon: '🍶' },
      { id: 'notebook' as any, name: 'Notebook', icon: '📓' },
      { id: ProductTarget.MUG, name: 'Ceramic Mugs', icon: '☕' },
      { id: ProductTarget.STICKER, name: 'Die-Cut Stickers', icon: '✂️' },
      { id: ProductTarget.WALL_ART, name: 'Framed Wall Art', icon: '🖼️' },
    ]
  }
];

export const STICKER_MATERIALS = [
  { id: StickerMaterial.DIE_CUT, name: 'Die Cut', description: 'Custom shaped cut around artwork', icon: '✂️' },
  { id: StickerMaterial.VINYL, name: 'White Vinyl', description: 'Most popular! Glossy finish', icon: '⚪' },
  { id: StickerMaterial.CLEAR, name: 'Clear', description: 'Highly transparent, near invisible', icon: '🫥' },
  { id: StickerMaterial.HOLOGRAPHIC, name: 'Holographic', description: 'Dazzling rainbow effect', icon: '🌈' },
  { id: StickerMaterial.GLITTER, name: 'Glitter', description: 'Stunning sparkly effects', icon: '✨' },
];
