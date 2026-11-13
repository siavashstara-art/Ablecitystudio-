/**
 * AbleStudio - Interactive Design Renderer (TypeScript port of editor/DesignRenderer.kt)
 * Direct-manipulation canvas with drag-and-drop, resize handles, live SVG vision filters,
 * accessible badge icons, and instant text editing.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  DesignProject,
  DesignLayer,
  TextLayer,
  ShapeLayer,
  BadgeLayer,
  QrLayer,
} from '../data/model/DesignProject';
import { resolveContent, LocaleCode } from '../core/localization/LocalizationEngine';
import { VisionSimulationType, VISION_SIMULATION_CONFIGS } from '../core/accessibility/AccessibilitySettings';
import {
  Accessibility,
  Ear,
  Eye,
  Subtitles,
  Activity,
  Heart,
  CheckCircle2,
  Info,
  QrCode as QrIcon,
} from 'lucide-react';

interface DesignRendererProps {
  project: DesignProject;
  activeLocale: LocaleCode;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (updated: DesignLayer) => void;
  zoom: number; // e.g. 0.8, 1, 1.2
  visionSimulation: VisionSimulationType;
  dyslexiaMode: boolean;
}

export const DesignRenderer: React.FC<DesignRendererProps> = ({
  project,
  activeLocale,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  zoom,
  visionSimulation,
  dyslexiaMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; layerX: number; layerY: number; w: number; h: number } | null>(null);

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId) || null;

  // Handle Layer Selection & Drag Start
  const handleLayerPointerDown = (e: React.PointerEvent, layer: DesignLayer) => {
    e.stopPropagation();
    if (layer.locked) return;
    onSelectLayer(layer.id);

    setDraggingId(layer.id);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
      w: layer.width,
      h: layer.height,
    });
  };

  // Handle Resize Handle Pointer Down
  const handleResizePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedLayer || selectedLayer.locked) return;
    setResizingHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      layerX: selectedLayer.x,
      layerY: selectedLayer.y,
      w: selectedLayer.width,
      h: selectedLayer.height,
    });
  };

  // Global Pointer Move & Up
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStart) return;

      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;

      if (resizingHandle && selectedLayer) {
        let newX = dragStart.layerX;
        let newY = dragStart.layerY;
        let newW = dragStart.w;
        let newH = dragStart.h;

        if (resizingHandle.includes('e')) newW = Math.max(30, dragStart.w + deltaX);
        if (resizingHandle.includes('s')) newH = Math.max(20, dragStart.h + deltaY);
        if (resizingHandle.includes('w')) {
          const proposedW = dragStart.w - deltaX;
          if (proposedW >= 30) {
            newW = proposedW;
            newX = dragStart.layerX + deltaX;
          }
        }
        if (resizingHandle.includes('n')) {
          const proposedH = dragStart.h - deltaY;
          if (proposedH >= 20) {
            newH = proposedH;
            newY = dragStart.layerY + deltaY;
          }
        }

        onUpdateLayer({
          ...selectedLayer,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (draggingId && selectedLayer && selectedLayer.id === draggingId) {
        onUpdateLayer({
          ...selectedLayer,
          x: Math.round(dragStart.layerX + deltaX),
          y: Math.round(dragStart.layerY + deltaY),
        });
      }
    };

    const handlePointerUp = () => {
      setDraggingId(null);
      setResizingHandle(null);
      setDragStart(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragStart, draggingId, resizingHandle, selectedLayer, zoom, onUpdateLayer]);

  // Keyboard accessibility: nudge with arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayer || selectedLayer.locked) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateLayer({ ...selectedLayer, y: selectedLayer.y - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateLayer({ ...selectedLayer, y: selectedLayer.y + step });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateLayer({ ...selectedLayer, x: selectedLayer.x - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateLayer({ ...selectedLayer, x: selectedLayer.x + step });
      } else if (e.key === 'Escape') {
        onSelectLayer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, onUpdateLayer, onSelectLayer]);

  // Determine active SVG filter style
  const activeFilterConfig = VISION_SIMULATION_CONFIGS.find((c) => c.id === visionSimulation);
  const filterStyle =
    visionSimulation !== 'none' && activeFilterConfig
      ? { filter: `url(#${activeFilterConfig.filterSvgId})` }
      : {};

  // Sort visible layers by zIndex
  const sortedLayers = [...project.layers]
    .filter((l) => l.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-8 select-none"
      onClick={() => onSelectLayer(null)}
      style={{
        width: '100%',
        minHeight: '100%',
      }}
    >
      {/* SVG Defs for Optical Vision Simulations */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          {VISION_SIMULATION_CONFIGS.map((cfg) => {
            if (cfg.id === 'none') return null;
            if (cfg.id === 'low-vision') {
              return (
                <filter key={cfg.filterSvgId} id={cfg.filterSvgId}>
                  <feGaussianBlur stdDeviation="1.5" />
                  <feColorMatrix type="matrix" values={cfg.colorMatrix} />
                </filter>
              );
            }
            return (
              <filter key={cfg.filterSvgId} id={cfg.filterSvgId}>
                <feColorMatrix type="matrix" values={cfg.colorMatrix} />
              </filter>
            );
          })}
        </defs>
      </svg>

      {/* Scaled Canvas Container */}
      <div
        className="relative transition-transform duration-75 shadow-2xl rounded-sm overflow-hidden"
        style={{
          width: project.width,
          height: project.height,
          backgroundColor: project.backgroundColor,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          ...filterStyle,
        }}
      >
        {/* Render Each Layer */}
        {sortedLayers.map((layer) => {
          const isSelected = layer.id === selectedLayerId;

          return (
            <div
              key={layer.id}
              id={`layer-${layer.id}`}
              onPointerDown={(e) => handleLayerPointerDown(e, layer)}
              className={`absolute cursor-move group transition-shadow ${
                isSelected ? 'ring-2 ring-amber-500 z-50' : 'hover:ring-1 hover:ring-amber-500/40'
              } ${layer.locked ? 'pointer-events-none opacity-90' : ''}`}
              style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                opacity: layer.opacity ?? 1,
                zIndex: layer.zIndex,
              }}
            >
              {/* Layer Content */}
              {renderLayerContent(layer, activeLocale, dyslexiaMode)}

              {/* Bounding Box & 8 Resize Handles when selected */}
              {isSelected && !layer.locked && (
                <>
                  {/* Subtle dimension badge */}
                  <div className="absolute -top-6 left-0 bg-stone-900 border border-stone-700 text-stone-300 text-[10px] font-mono-data px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap shadow-sm">
                    {layer.width} × {layer.height} px
                  </div>

                  {/* Corner handles */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-stone-800 rounded-sm cursor-nwse-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-stone-800 rounded-sm cursor-nesw-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-stone-800 rounded-sm cursor-nwse-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-stone-800 rounded-sm cursor-nesw-resize shadow"
                  />

                  {/* Mid-edge handles */}
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'n')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-white border border-stone-800 rounded-sm cursor-ns-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 's')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-white border border-stone-800 rounded-sm cursor-ns-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'w')}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-3 bg-white border border-stone-800 rounded-sm cursor-ew-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handleResizePointerDown(e, 'e')}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-3 bg-white border border-stone-800 rounded-sm cursor-ew-resize shadow"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Renders individual layer content according to type
 */
function renderLayerContent(layer: DesignLayer, activeLocale: LocaleCode, dyslexiaMode: boolean) {
  switch (layer.type) {
    case 'text': {
      const textLayer = layer as TextLayer;
      const textValue = resolveContent(textLayer.stringKey || textLayer.text, activeLocale);
      const isRtl = activeLocale === 'ar';

      return (
        <div
          className={`w-full h-full overflow-hidden select-none ${dyslexiaMode ? 'font-dyslexic' : ''}`}
          dir={isRtl ? 'rtl' : 'ltr'}
          style={{
            color: textLayer.color,
            fontSize: `${textLayer.fontSize}px`,
            fontFamily: dyslexiaMode ? undefined : textLayer.fontFamily,
            fontWeight: textLayer.fontWeight,
            textAlign: textLayer.textAlign,
            lineHeight: textLayer.lineHeight || 1.3,
            letterSpacing: `${textLayer.letterSpacing || 0}px`,
            backgroundColor: textLayer.backgroundColor || 'transparent',
            padding: textLayer.padding ? `${textLayer.padding}px` : undefined,
            borderRadius: textLayer.borderRadius ? `${textLayer.borderRadius}px` : undefined,
            wordBreak: 'break-word',
          }}
        >
          {textValue}
        </div>
      );
    }

    case 'shape': {
      const shape = layer as ShapeLayer;
      const isCircle = shape.shapeKind === 'circle';

      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: shape.fillColor,
            borderRadius: isCircle ? '50%' : `${shape.borderRadius || 0}px`,
            border: shape.strokeColor && shape.strokeWidth ? `${shape.strokeWidth}px solid ${shape.strokeColor}` : undefined,
          }}
        />
      );
    }

    case 'badge': {
      const badge = layer as BadgeLayer;
      const labelText = resolveContent(badge.stringKey || badge.label, activeLocale);

      return (
        <div
          className="w-full h-full flex items-center gap-2.5 px-3 py-1.5 shadow-sm"
          style={{
            backgroundColor: badge.bgColor,
            borderRadius: `${badge.borderRadius || 8}px`,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0 rounded-full"
            style={{
              color: badge.iconColor,
            }}
          >
            {renderBadgeIcon(badge.icon)}
          </div>
          {labelText && badge.layout !== 'icon-only' && (
            <span
              className="text-xs font-semibold text-stone-100 truncate"
              style={{
                fontFamily: 'Plus Jakarta Sans',
              }}
            >
              {labelText}
            </span>
          )}
        </div>
      );
    }

    case 'qr': {
      const qr = layer as QrLayer;
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-2.5 rounded shadow-sm border border-stone-800"
          style={{
            backgroundColor: qr.bgColor,
            color: qr.fgColor,
          }}
        >
          <div className="relative w-full aspect-square flex items-center justify-center">
            {/* Real SVG QR Pattern Mockup with standard corner markers */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Corner 1 (Top-Left) */}
              <rect x="5" y="5" width="28" height="28" fill={qr.fgColor} />
              <rect x="9" y="9" width="20" height="20" fill={qr.bgColor} />
              <rect x="13" y="13" width="12" height="12" fill={qr.fgColor} />

              {/* Corner 2 (Top-Right) */}
              <rect x="67" y="5" width="28" height="28" fill={qr.fgColor} />
              <rect x="71" y="9" width="20" height="20" fill={qr.bgColor} />
              <rect x="75" y="13" width="12" height="12" fill={qr.fgColor} />

              {/* Corner 3 (Bottom-Left) */}
              <rect x="5" y="67" width="28" height="28" fill={qr.fgColor} />
              <rect x="9" y="71" width="20" height="20" fill={qr.bgColor} />
              <rect x="13" y="75" width="12" height="12" fill={qr.fgColor} />

              {/* Random Data Pattern Dots */}
              <rect x="38" y="8" width="5" height="5" fill={qr.fgColor} />
              <rect x="48" y="12" width="5" height="5" fill={qr.fgColor} />
              <rect x="58" y="18" width="5" height="5" fill={qr.fgColor} />
              <rect x="42" y="24" width="5" height="5" fill={qr.fgColor} />
              <rect x="52" y="28" width="5" height="5" fill={qr.fgColor} />

              <rect x="8" y="38" width="5" height="5" fill={qr.fgColor} />
              <rect x="18" y="44" width="5" height="5" fill={qr.fgColor} />
              <rect x="28" y="38" width="5" height="5" fill={qr.fgColor} />

              <rect x="38" y="38" width="8" height="8" fill={qr.fgColor} />
              <rect x="50" y="42" width="8" height="8" fill={qr.fgColor} />
              <rect x="62" y="36" width="6" height="6" fill={qr.fgColor} />
              <rect x="40" y="54" width="6" height="6" fill={qr.fgColor} />
              <rect x="52" y="58" width="10" height="10" fill={qr.fgColor} />
              <rect x="68" y="50" width="8" height="8" fill={qr.fgColor} />
              <rect x="80" y="42" width="8" height="8" fill={qr.fgColor} />

              <rect x="38" y="72" width="6" height="6" fill={qr.fgColor} />
              <rect x="50" y="78" width="8" height="8" fill={qr.fgColor} />
              <rect x="65" y="72" width="8" height="8" fill={qr.fgColor} />
              <rect x="78" y="78" width="6" height="6" fill={qr.fgColor} />
              <rect x="88" y="88" width="6" height="6" fill={qr.fgColor} />
            </svg>
          </div>
          {qr.label && (
            <span className="text-[10px] font-semibold tracking-wide text-center mt-1 truncate max-w-full">
              {qr.label}
            </span>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * Maps accessible icon types to Lucide vector icons
 */
function renderBadgeIcon(iconType: string) {
  const size = 18;
  switch (iconType) {
    case 'wheelchair':
      return <Accessibility size={size} />;
    case 'asl':
      return <Ear size={size} />;
    case 'audio-description':
      return <Eye size={size} />;
    case 'closed-captions':
      return <Subtitles size={size} />;
    case 'sensory':
      return <Heart size={size} />;
    case 'neurodiverse':
      return <Activity size={size} />;
    case 'check-circle':
      return <CheckCircle2 size={size} />;
    default:
      return <Info size={size} />;
  }
}
