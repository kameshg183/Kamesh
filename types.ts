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
  SMALL = 'small', // 3x5 grid approx
  MEDIUM = 'medium', // 2x4 grid approx
  LARGE = 'large' // 2x3 grid approx
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
  tagWidth?: number;
  tagHeight?: number;
  textScales?: Record<string, number>; // ID-based font scales
}

export interface AppConfiguration {
  labels: TagLabels;
  visuals: TagVisuals;
}