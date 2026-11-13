/**
 * AbleStudio - Design Project Model (TypeScript port of data/model/DesignProject.kt)
 */

import { LocaleCode } from '../../core/localization/LocalizationEngine';

export type LayerType = 'text' | 'shape' | 'badge' | 'qr' | 'image';

export type ShapeKind = 'rectangle' | 'circle' | 'pill' | 'star' | 'card' | 'divider';

export type SemanticRole = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'callout' | 'button';

export type AccessibleIconType =
  | 'wheelchair'
  | 'asl'
  | 'audio-description'
  | 'closed-captions'
  | 'braille'
  | 'high-contrast'
  | 'sensory'
  | 'neurodiverse'
  | 'guide-dog'
  | 'check-circle'
  | 'heart'
  | 'info';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  zIndex: number;
  altText?: string;
  ariaLabel?: string;
  isClickable?: boolean; // When true, audited for WCAG 44x44px target
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  stringKey?: string; // e.g. @string/event_title for instant localization
  fontSize: number;
  fontFamily: string;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800';
  color: string;
  backgroundColor?: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  semanticRole: SemanticRole;
  borderRadius?: number;
  padding?: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeKind: ShapeKind;
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  elevation?: 'none' | 'low' | 'medium' | 'high';
}

export interface BadgeLayer extends BaseLayer {
  type: 'badge';
  icon: AccessibleIconType;
  label: string;
  stringKey?: string;
  iconColor: string;
  bgColor: string;
  borderRadius: number;
  layout: 'icon-only' | 'icon-and-label';
}

export interface QrLayer extends BaseLayer {
  type: 'qr';
  value: string;
  label?: string;
  fgColor: string;
  bgColor: string;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain';
  borderRadius: number;
}

export type DesignLayer = TextLayer | ShapeLayer | BadgeLayer | QrLayer | ImageLayer;

export interface CanvasPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'social' | 'print' | 'signage' | 'card';
  icon: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'square-post', name: 'Social Square (1:1)', width: 800, height: 800, category: 'social', icon: 'Square' },
  { id: 'social-banner', name: 'Header / Social Card', width: 1200, height: 630, category: 'social', icon: 'RectangleHorizontal' },
  { id: 'flyer-a4', name: 'Accessible Notice Flyer', width: 800, height: 1120, category: 'print', icon: 'FileText' },
  { id: 'story-portrait', name: 'Mobile / Story (9:16)', width: 720, height: 1280, category: 'social', icon: 'Smartphone' },
  { id: 'access-card', name: 'Accessibility Pass / Badge', width: 800, height: 500, category: 'card', icon: 'CreditCard' },
];

export interface DesignProject {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: DesignLayer[];
  locale: LocaleCode;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  targetContrastStandard: 'AA' | 'AAA';
}

export interface ProjectHistory {
  past: DesignProject[];
  present: DesignProject;
  future: DesignProject[];
}
