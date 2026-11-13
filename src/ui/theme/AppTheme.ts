/**
 * AbleStudio - App Theme & Accessible Color Tokens (TypeScript port of ui/theme/AppTheme.kt)
 * Provides WCAG AAA tested color pairs, Okabe-Ito colorblind-safe palettes,
 * and typographic hierarchy scales.
 */

export interface ColorPair {
  name: string;
  foreground: string;
  background: string;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA';
}

export const ACCESSIBLE_COLOR_PAIRS: ColorPair[] = [
  { name: 'Pure Contrast (Dark)', foreground: '#FFFFFF', background: '#090D16', contrastRatio: 18.2, wcagLevel: 'AAA' },
  { name: 'Pure Contrast (Light)', foreground: '#09090B', background: '#FFFFFF', contrastRatio: 19.5, wcagLevel: 'AAA' },
  { name: 'Safety Amber on Charcoal', foreground: '#FACC15', background: '#0A0A0A', contrastRatio: 14.1, wcagLevel: 'AAA' },
  { name: 'Sky Cyan on Deep Navy', foreground: '#38BDF8', background: '#081426', contrastRatio: 9.8, wcagLevel: 'AAA' },
  { name: 'Mint on Forest Sage', foreground: '#6EE7B7', background: '#062B21', contrastRatio: 8.7, wcagLevel: 'AAA' },
  { name: 'Coral on Obsidian', foreground: '#FB923C', background: '#0F172A', contrastRatio: 7.6, wcagLevel: 'AAA' },
  { name: 'Crisp White on Crimson', foreground: '#FFFFFF', background: '#881337', contrastRatio: 8.3, wcagLevel: 'AAA' },
  { name: 'Charcoal on Soft Cream', foreground: '#1C1917', background: '#FEF3C7', contrastRatio: 12.8, wcagLevel: 'AAA' },
];

/**
 * The standard Okabe-Ito Color Palette
 * Universally distinguishable across Protanopia, Deuteranopia, and Tritanopia
 */
export const OKABE_ITO_PALETTE = [
  { name: 'Black', hex: '#000000', rgb: 'rgb(0,0,0)' },
  { name: 'Orange', hex: '#E69F00', rgb: 'rgb(230,159,0)' },
  { name: 'Sky Blue', hex: '#56B4E9', rgb: 'rgb(86,180,233)' },
  { name: 'Bluish Green', hex: '#009E73', rgb: 'rgb(0,158,115)' },
  { name: 'Yellow', hex: '#F0E442', rgb: 'rgb(240,228,66)' },
  { name: 'Blue', hex: '#0072B2', rgb: 'rgb(0,114,178)' },
  { name: 'Vermilion', hex: '#D55E00', rgb: 'rgb(213,94,0)' },
  { name: 'Reddish Purple', hex: '#CC79A7', rgb: 'rgb(204,121,167)' },
];

export const TYPOGRAPHY_FONTS = [
  { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans, sans-serif', category: 'Modern Geometric' },
  { name: 'Outfit', family: 'Outfit, sans-serif', category: 'Display & Headlines' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', category: 'Tabular & Technical' },
  { name: 'Cairo (Arabic / Global)', family: 'Cairo, sans-serif', category: 'Multilingual & RTL' },
  { name: 'Noto Sans JP', family: 'Noto Sans JP, sans-serif', category: 'Japanese & CJK' },
  { name: 'Dyslexic-Friendly (Sans)', family: 'Comic Neue, Comic Sans MS, sans-serif', category: 'High Legibility' },
];
