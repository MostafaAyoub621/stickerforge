
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
      { id: ProductTarget.NONE, name: 'Design Only (No Mockup)' },
    ]
  },
  {
    name: 'Clothing',
    items: [
      { id: ProductTarget.TSHIRT, name: 'T-Shirts & Tops' },
      { id: ProductTarget.OVERSIZED_TSHIRT, name: 'Oversized T-Shirts' },
      { id: ProductTarget.DRESS, name: 'Dresses' },
      { id: ProductTarget.KIDS_CLOTHES, name: 'Kids & Babies' },
      { id: ProductTarget.SCARF, name: 'Scarves' },
      { id: ProductTarget.SOCKS, name: 'Socks' },
    ]
  },
  {
    name: 'Accessories',
    items: [
      { id: ProductTarget.BUCKET_HAT, name: 'Bucket Hats' },
      { id: ProductTarget.TOTE_BAG, name: 'Tote Bags' },
      { id: ProductTarget.PHONE_CASE, name: 'Phone Cases' },
    ]
  },
  {
    name: 'Home & Stickers',
    items: [
      { id: ProductTarget.MUG, name: 'Mugs' },
      { id: ProductTarget.STICKER, name: 'All Stickers' },
      { id: ProductTarget.WALL_ART, name: 'Wall Art' },
    ]
  }
];

export const STICKER_MATERIALS = [
  { id: StickerMaterial.DIE_CUT, name: 'Die Cut', description: 'Custom shaped cut around artwork', icon: '✂️' },
  { id: StickerMaterial.VINYL, name: 'White Vinyl', description: 'Most popular! Glossy finish', icon: '⚪' },
  { id: StickerMaterial.CLEAR, name: 'Clear', description: 'Highly transparent, near invisible', icon: '🫥' },
  { id: StickerMaterial.HOLOGRAPHIC, name: 'Holographic', description: 'Dazzling rainbow effect', icon: '🌈' },
  { id: StickerMaterial.GLITTER, name: 'Glitter', description: 'Stunning sparkly effects', icon: '✨' },
  { id: StickerMaterial.MIRROR_GOLD, name: 'Mirror Gold', description: 'Metallic gold vinyl', icon: '🟡' },
  { id: StickerMaterial.MIRROR_SILVER, name: 'Mirror Silver', description: 'Metallic silver vinyl', icon: '⚪' },
  { id: StickerMaterial.HEAVY_DUTY, name: 'Heavy Duty', description: '8x thicker, built for extreme use', icon: '🛡️' },
  { id: StickerMaterial.BIODEGRADABLE, name: 'Eco-Friendly', description: 'Compostable, made from wood pulp', icon: '🌱' },
  { id: StickerMaterial.FLUORESCENT, name: 'Fluorescent', description: 'Vibrant neon colors', icon: '🏮' },
  { id: StickerMaterial.TRANSFER, name: 'Transfer', description: 'Single piece vinyl, bold designs', icon: '🎞️' },
  { id: StickerMaterial.MAGNET, name: 'Magnet', description: 'Sticks to magnetic surfaces', icon: '🧲' },
  { id: StickerMaterial.EGGSHELL, name: 'Eggshell', description: 'Anti-tamper, hard to remove', icon: '🥚' },
  { id: StickerMaterial.KISS_CUT, name: 'Kiss Cut', description: 'Peel fast, printable border', icon: '💋' },
];
