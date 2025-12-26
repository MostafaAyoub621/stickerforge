
export enum DesignStyle {
  MINIMAL = 'minimal',
  VINTAGE = 'vintage',
  MASCOT = 'mascot',
  MONOGRAM = 'monogram',
  HALFTONE = 'halftone',
  DISTRESSED = 'distressed',
  CYBERPUNK = 'cyberpunk',
  KAWAII = 'kawaii',
  BAUHAUS = 'bauhaus',
  ART_DECO = 'art_deco',
  PSYCHEDELIC = 'psychedelic',
  GEOMETRIC = 'geometric',
  GHIBLI = 'ghibli',
  NEO_TRADITIONAL = 'neo_traditional',
  BRUTALIST = 'brutalist',
  VAPORWAVE = 'vaporwave',
  LINE_ART = 'line_art',
  ISOMETRIC = 'isometric',
  CLAYMORPHISM = 'claymorphism',
  STAINED_GLASS = 'stained_glass',
  NEOMORPHISM = 'neomorphism',
  GRAFFITI = 'graffiti',
  WATERCOLOR = 'watercolor',
  GLASSMORPHISM = 'glassmorphism',
  RETRO_FUTURISM = 'retro_futurism',
  ORIGAMI = 'origami',
  CUBISM = 'cubism'
}

export enum ProductTarget {
  NONE = 'none',
  TSHIRT = 'tshirt',
  OVERSIZED_TSHIRT = 'oversized_tshirt',
  MUG = 'mug',
  STICKER = 'sticker',
  BUCKET_HAT = 'bucket_hat',
  SOCKS = 'socks',
  SCARF = 'scarf',
  KIDS_CLOTHES = 'kids_clothes',
  DRESS = 'dress',
  PHONE_CASE = 'phone_case',
  TOTE_BAG = 'tote_bag',
  WALL_ART = 'wall_art'
}

export enum StickerMaterial {
  VINYL = 'vinyl',
  DIE_CUT = 'die_cut',
  KISS_CUT = 'kiss_cut',
  CLEAR = 'clear',
  HOLOGRAPHIC = 'holographic',
  GLITTER = 'glitter',
  MIRROR_SILVER = 'mirror_silver',
  MIRROR_GOLD = 'mirror_gold',
  BIODEGRADABLE = 'biodegradable',
  FLUORESCENT = 'fluorescent',
  HEAVY_DUTY = 'heavy_duty',
  TRANSFER = 'transfer',
  MAGNET = 'magnet',
  EGGSHELL = 'eggshell'
}

export enum CanvasBackground {
  WHITE = 'white',
  BLACK = 'black',
  TRANSPARENT = 'transparent',
  STUDIO = 'studio',
  WARM_STUDIO = 'warm_studio',
  DARK_GRID = 'dark_grid',
  MESH = 'mesh'
}

export enum TextPosition {
  OVERLAY = 'overlay',
  BELOW = 'below',
  INTEGRATED = 'integrated'
}

export interface ListingMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface TrendingIdea {
  title: string;
  niche: string;
  reason: string;
  suggestedPrompt: string;
}

export interface DesignAsset {
  id: string;
  url: string;
  type: 'image' | 'svg';
  prompt?: string;
  name: string;
  timestamp: number;
  vectorPaths?: string[]; 
  metadata?: ListingMetadata;
}

export interface ProjectState {
  currentAsset: DesignAsset | null;
  history: DesignAsset[];
  style: DesignStyle;
  target: ProductTarget;
  material: StickerMaterial;
  background: CanvasBackground;
  brandName: string;
  logoText: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  mergeTextWithStyle: boolean;
  textPosition: TextPosition;
  imageInput?: string; 
}

export type ExportFormat = 'SVG' | 'PNG' | 'JPG' | 'WEBP' | 'PDF' | 'PRINTFUL' | 'REDBUBBLE' | 'ETSY' | 'PRINTIFY';
