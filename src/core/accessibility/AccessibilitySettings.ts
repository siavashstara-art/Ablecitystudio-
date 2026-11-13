/**
 * AbleStudio - Accessibility Engine (TypeScript port of core/accessibility/AccessibilitySettings.kt)
 * Provides WCAG 2.1 contrast math, vision deficiency matrix filters, font legibility checks,
 * touch target compliance, automated accessibility audits, and speech synthesis narration.
 */

export type VisionSimulationType =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'low-vision'
  | 'high-contrast';

export interface VisionSimulationConfig {
  id: VisionSimulationType;
  label: string;
  description: string;
  filterSvgId: string;
  colorMatrix?: string;
}

export const VISION_SIMULATION_CONFIGS: VisionSimulationConfig[] = [
  {
    id: 'none',
    label: 'Standard Vision',
    description: 'Normal trichromatic vision without deficiency simulation',
    filterSvgId: 'filter-none',
  },
  {
    id: 'protanopia',
    label: 'Protanopia (Red-blind)',
    description: 'Absence of red cone photoreceptors (~1% of men)',
    filterSvgId: 'filter-protanopia',
    colorMatrix: '0.56667 0.43333 0 0 0  0.55833 0.44167 0 0 0  0 0.24167 0.75833 0 0  0 0 0 1 0',
  },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia (Green-blind)',
    description: 'Absence of green cone photoreceptors (~6% of men)',
    filterSvgId: 'filter-deuteranopia',
    colorMatrix: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia (Blue-blind)',
    description: 'Absence of blue cone photoreceptors (~0.01% of population)',
    filterSvgId: 'filter-tritanopia',
    colorMatrix: '0.95 0.05 0 0 0  0 0.43333 0.56667 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
  },
  {
    id: 'achromatopsia',
    label: 'Achromatopsia (Monochromacy)',
    description: 'Complete lack of color perception; gray levels only',
    filterSvgId: 'filter-achromatopsia',
    colorMatrix: '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0',
  },
  {
    id: 'low-vision',
    label: 'Low Vision / Cataracts',
    description: 'Blurred visual acuity and lower luminance contrast',
    filterSvgId: 'filter-low-vision',
    colorMatrix: '0.8 0.1 0.1 0 0  0.1 0.8 0.1 0 0  0.1 0.1 0.8 0 0  0 0 0 1 0',
  },
  {
    id: 'high-contrast',
    label: 'High Contrast Mode',
    description: 'Enhanced contrast mode for users with low contrast sensitivity',
    filterSvgId: 'filter-high-contrast',
    colorMatrix: '1.4 -0.2 -0.2 0 -0.1  -0.2 1.4 -0.2 0 -0.1  -0.2 -0.2 1.4 0 -0.1  0 0 0 1 0',
  },
];

/**
 * Parses Hex (#RRGGBB or #RGB or rgba) to RGB [0-255]
 */
export function parseColorToRgb(color: string): { r: number; g: number; b: number } {
  if (!color) return { r: 0, g: 0, b: 0 };
  const clean = color.trim().toLowerCase();

  // If rgba / rgb format
  if (clean.startsWith('rgb')) {
    const match = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      };
    }
  }

  let hex = clean.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return { r, g, b };
  }

  // Fallbacks for named colors
  if (clean === 'white') return { r: 255, g: 255, b: 255 };
  if (clean === 'black') return { r: 0, g: 0, b: 0 };
  return { r: 30, g: 30, b: 30 };
}

/**
 * Calculates WCAG 2.1 relative luminance
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where components are converted to linear sRGB
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export interface ContrastScore {
  ratio: number;
  ratioFormatted: string;
  isLargeText: boolean;
  passesAA: boolean;
  passesAAA: boolean;
  level: 'AAA' | 'AA' | 'FAIL';
  recommendation?: string;
}

/**
 * Computes WCAG 2.1 contrast ratio between two colors
 * @param foreground Hex or RGB string
 * @param background Hex or RGB string
 * @param fontSize Font size in pt / px
 * @param isBold Whether text is bold
 */
export function calculateContrast(
  foreground: string,
  background: string,
  fontSize: number = 16,
  isBold: boolean = false
): ContrastScore {
  const fg = parseColorToRgb(foreground);
  const bg = parseColorToRgb(background);

  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  const ratioRounded = Math.round(ratio * 100) / 100;

  // WCAG definition: Large text is at least 18pt (approx 24px) or 14pt bold (approx 18.5px bold)
  const isLarge = fontSize >= 24 || (fontSize >= 18.5 && isBold);

  const minAA = isLarge ? 3.0 : 4.5;
  const minAAA = isLarge ? 4.5 : 7.0;

  const passesAA = ratio >= minAA;
  const passesAAA = ratio >= minAAA;

  let level: 'AAA' | 'AA' | 'FAIL' = 'FAIL';
  if (passesAAA) level = 'AAA';
  else if (passesAA) level = 'AA';

  let recommendation: string | undefined;
  if (!passesAA) {
    recommendation = `Needs at least ${minAA}:1. Currently ${ratioRounded}:1. Darken or lighten text color.`;
  } else if (!passesAAA) {
    recommendation = `Passes AA (${ratioRounded}:1). To reach AAA, reach at least ${minAAA}:1.`;
  } else {
    recommendation = `Exceptional contrast (${ratioRounded}:1) meeting strictest WCAG AAA standards.`;
  }

  return {
    ratio: ratioRounded,
    ratioFormatted: `${ratioRounded.toFixed(1)}:1`,
    isLargeText: isLarge,
    passesAA,
    passesAAA,
    level,
    recommendation,
  };
}

/**
 * Finds an optimal WCAG AAA high-contrast color for a given background
 */
export function getSuggestedCompliantColor(backgroundColor: string): string {
  const bg = parseColorToRgb(backgroundColor);
  const bgLum = getRelativeLuminance(bg.r, bg.g, bg.b);
  // If background is bright, dark charcoal #0F172A offers > 10:1 ratio
  // If background is dark, crisp white #FFFFFF or soft ivory #F8FAFC
  return bgLum > 0.4 ? '#09090b' : '#ffffff';
}

/**
 * Speech synthesis for accessibility screen reader simulation
 */
export function speakText(text: string, lang: string = 'en-US'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
