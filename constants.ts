import { FontTheme, TagLabels, TagVisuals, AppConfiguration } from './types';

export const SAMPLE_DATA = `Product Name,Quantity,MRP,Offer Price
Maaza Mango Drink,1.75 Ltr,99,59
Coca Cola,2.25 Ltr,95,75
Basmati Rice (Premium),5 Kg,650,450
Sunflower Oil,1 Ltr,180,145
Good Day Cashew Cookies,200g,40,30
Maggi Noodles (Pack of 12),840g,168,140
Surf Excel Matic,2 Kg,450,380
Tata Salt,1 Kg,28,24
Red Label Tea,500g,280,240`;

export const DEFAULT_TAG_LABELS: TagLabels = {
  currency: '₹',
  offLabel: 'Off',
  bestPriceLabel: 'Best Price',
  mrpLabel: 'MRP',
  priceLabel: 'Our Price'
};

export const DEFAULT_VISUALS: TagVisuals = {
  fontScale: 1,
  separatorStyle: 'dashed',
  separatorThickness: 2,
  sectionSpacing: 1.5,
  sectionOrder: ['savings', 'product', 'footer'],
  tagWidth: 380, // Optimized for 2-column A4
  tagHeight: 300,
  textScales: {}
};

export const DEFAULT_CONFIG: AppConfiguration = {
  labels: DEFAULT_TAG_LABELS,
  visuals: DEFAULT_VISUALS
};

export const FONT_THEMES: Record<FontTheme, { label: string; nameClass: string; priceClass: string; metaClass: string }> = {
  classic: {
    label: 'Classic',
    nameClass: 'font-serif',
    priceClass: 'font-serif',
    metaClass: 'font-sans'
  },
  modern: {
    label: 'Modern',
    nameClass: 'font-oswald tracking-wide uppercase',
    priceClass: 'font-oswald',
    metaClass: 'font-opensans'
  },
  elegant: {
    label: 'Elegant',
    nameClass: 'font-playfair italic',
    priceClass: 'font-playfair',
    metaClass: 'font-lato'
  }
};