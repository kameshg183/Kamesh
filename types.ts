export interface Product {
  id: string;
  name: string;
  quantity: string;
  mrp: number;
  price: number;
  customVisuals?: Partial<TagVisuals>;
}

export interface CSVParsedRow {
  [key: string]: string;
}

export enum TagSize {
  SMALL = 'small', 
  MEDIUM = 'medium', 
  LARGE = 'large' 
}

export type FontTheme = 'classic' | 'modern' | 'elegant';

export interface TagLabels {
  currency: string;
  offLabel: string;
  bestPriceLabel: string;
  mrpLabel: string;
  priceLabel: string;
}

export type TagSection = 'savings' | 'product' | 'footer';

export interface TagVisuals {
  fontScale: number; // 0.8 to 1.3
  separatorStyle: 'dashed' | 'solid' | 'dotted' | 'none';
  separatorThickness: number; // 1 to 5px
  sectionSpacing: number; // Padding/Margin multiplier
  sectionOrder: TagSection[];
  
  // Dimensions in CENTIMETERS
  tagWidth?: number; 
  tagHeight?: number;
  
  // Padding in CENTIMETERS (controlled by Ruler)
  paddingX?: number;
  paddingY?: number;

  textScales?: Record<string, number>; // ID-based font scales
  layoutDirection?: 'row' | 'col'; // Content flow direction
}

export interface SheetSettings {
  paddingX: number; // Horizontal margin (symmetric left/right) in CM
  paddingY: number; // Vertical margin (symmetric top/bottom) in CM
  gapX: number; // Horizontal gap between items in CM
  gapY: number; // Vertical gap between items in CM
}

export interface AppConfiguration {
  labels: TagLabels;
  visuals: TagVisuals;
  sheetSettings: SheetSettings;
  paperOrientation?: 'portrait' | 'landscape';
  pageOrientations?: Record<number, 'portrait' | 'landscape'>; // Per-page override
}