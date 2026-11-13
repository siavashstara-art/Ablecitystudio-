/**
 * AbleStudio - High-Resolution Exporter (TypeScript port of export/PngExporter.kt)
 * Renders design projects to pixel-perfect PNG (1x, 2x, 3x), vector SVG,
 * and generates downloadable WCAG Accessibility Compliance Reports.
 */

import { DesignProject, DesignLayer, TextLayer, ShapeLayer, BadgeLayer, QrLayer, ImageLayer } from '../data/model/DesignProject';
import { resolveContent, LocaleCode } from '../core/localization/LocalizationEngine';
import { calculateContrast } from '../core/accessibility/AccessibilitySettings';

export class PngExporter {
  /**
   * Exports project canvas to PNG image blob & triggers download
   */
  static async exportToPng(
    project: DesignProject,
    scale: number = 2,
    locale: LocaleCode = project.locale
  ): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = project.width * scale;
    canvas.height = project.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create 2D canvas context');

    // Scale canvas context
    ctx.scale(scale, scale);

    // Wait for fonts to be ready
    if (document.fonts) {
      await document.fonts.ready;
    }

    // 1. Draw Background
    ctx.fillStyle = project.backgroundColor;
    ctx.fillRect(0, 0, project.width, project.height);

    // 2. Sort layers by zIndex
    const sortedLayers = [...project.layers].filter((l) => l.visible !== false).sort((a, b) => a.zIndex - b.zIndex);

    // 3. Render each layer
    for (const layer of sortedLayers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      // Handle layer rotation
      if (layer.rotation) {
        const cx = layer.x + layer.width / 2;
        const cy = layer.y + layer.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      switch (layer.type) {
        case 'shape':
          this.drawShape(ctx, layer as ShapeLayer);
          break;
        case 'badge':
          this.drawBadge(ctx, layer as BadgeLayer, locale);
          break;
        case 'text':
          this.drawText(ctx, layer as TextLayer, locale);
          break;
        case 'qr':
          this.drawQrCode(ctx, layer as QrLayer);
          break;
        case 'image':
          await this.drawImage(ctx, layer as ImageLayer);
          break;
      }

      ctx.restore();
    }

    // Convert canvas to Blob and download
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        a.download = `${sanitizedTitle}_${locale}_${scale}x.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    });
  }

  /**
   * Exports project as standalone vector SVG
   */
  static exportToSvg(project: DesignProject, locale: LocaleCode = project.locale): void {
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${project.width} ${project.height}" width="${project.width}" height="${project.height}">\n`;
    const bgRect = `  <rect width="${project.width}" height="${project.height}" fill="${project.backgroundColor}" />\n`;

    let content = svgHeader + bgRect;
    const sortedLayers = [...project.layers].filter((l) => l.visible !== false).sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (layer.type === 'shape') {
        const shape = layer as ShapeLayer;
        if (shape.shapeKind === 'circle') {
          content += `  <circle cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" r="${shape.width / 2}" fill="${shape.fillColor}" />\n`;
        } else {
          content += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.borderRadius || 0}" fill="${shape.fillColor}" stroke="${shape.strokeColor || 'none'}" stroke-width="${shape.strokeWidth || 0}" />\n`;
        }
      } else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        const resolved = resolveContent(textLayer.stringKey || textLayer.text, locale);
        content += `  <text x="${textLayer.x}" y="${textLayer.y + textLayer.fontSize}" font-family="${textLayer.fontFamily}" font-size="${textLayer.fontSize}" font-weight="${textLayer.fontWeight}" fill="${textLayer.color}">${this.escapeXml(resolved)}</text>\n`;
      }
    }

    content += `</svg>`;

    const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${locale}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a comprehensive WCAG 2.1 Accessibility Audit Report text file
   */
  static generateAccessibilityReport(project: DesignProject): string {
    const textLayers = project.layers.filter((l) => l.type === 'text') as TextLayer[];
    let report = `=======================================================\n`;
    report += `ABLESTUDIO - ACCESSIBILITY COMPLIANCE AUDIT CERTIFICATE\n`;
    report += `=======================================================\n\n`;
    report += `Project Title: ${project.title}\n`;
    report += `Date of Audit: ${new Date().toUTCString()}\n`;
    report += `Target WCAG Standard: Level ${project.targetContrastStandard}\n`;
    report += `Canvas Dimensions: ${project.width} x ${project.height} px\n`;
    report += `Active Locale: ${project.locale.toUpperCase()}\n\n`;

    report += `-------------------------------------------------------\n`;
    report += `1. COLOR CONTRAST ANALYSIS (WCAG 2.1 Criteria 1.4.3 & 1.4.6)\n`;
    report += `-------------------------------------------------------\n`;

    let passCount = 0;
    let failCount = 0;

    textLayers.forEach((layer, idx) => {
      const bg = layer.backgroundColor || project.backgroundColor;
      const contrast = calculateContrast(layer.color, bg, layer.fontSize, parseInt(layer.fontWeight, 10) >= 600);
      const isCompliant = project.targetContrastStandard === 'AAA' ? contrast.passesAAA : contrast.passesAA;
      if (isCompliant) passCount++;
      else failCount++;

      report += `Layer [${idx + 1}] "${layer.name}":\n`;
      report += `  - Text: "${layer.text.substring(0, 40)}${layer.text.length > 40 ? '...' : ''}"\n`;
      report += `  - Foreground: ${layer.color} | Background: ${bg}\n`;
      report += `  - Contrast Ratio: ${contrast.ratioFormatted} (Level: ${contrast.level})\n`;
      report += `  - Compliant for ${project.targetContrastStandard}: ${isCompliant ? 'PASS' : 'FAIL'}\n`;
      if (contrast.recommendation) {
        report += `  - Recommendation: ${contrast.recommendation}\n`;
      }
      report += `\n`;
    });

    report += `-------------------------------------------------------\n`;
    report += `2. ACCESSIBILITY COMPLIANCE SUMMARY\n`;
    report += `-------------------------------------------------------\n`;
    report += `Total Text Elements Audited: ${textLayers.length}\n`;
    report += `Passing Elements: ${passCount}\n`;
    report += `Elements Requiring Adjustment: ${failCount}\n`;
    const complianceRate = textLayers.length > 0 ? Math.round((passCount / textLayers.length) * 100) : 100;
    report += `Overall Compliance Rating: ${complianceRate}%\n\n`;

    report += `-------------------------------------------------------\n`;
    report += `3. SCREEN READER TRANSCRIPT / AUDIO DESCRIPTION\n`;
    report += `-------------------------------------------------------\n`;
    project.layers.forEach((layer) => {
      if (layer.altText || (layer.type === 'text' && (layer as TextLayer).text)) {
        report += `- [${layer.type.toUpperCase()}] ${layer.altText || (layer as TextLayer).text}\n`;
      }
    });

    report += `\n=======================================================\n`;
    report += `Certified by AbleStudio Accessibility Engine\n`;
    report += `=======================================================\n`;

    return report;
  }

  static downloadAccessibilityReport(project: DesignProject): void {
    const text = this.generateAccessibilityReport(project);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_a11y_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Internal Canvas Drawing Helpers ---

  private static drawShape(ctx: CanvasRenderingContext2D, layer: ShapeLayer): void {
    ctx.beginPath();
    const { x, y, width, height, shapeKind, fillColor, strokeColor, strokeWidth, borderRadius = 0 } = layer;

    ctx.fillStyle = fillColor;
    if (strokeColor && strokeWidth) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
    }

    if (shapeKind === 'circle') {
      const radius = Math.min(width, height) / 2;
      ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      if (strokeColor && strokeWidth) ctx.stroke();
    } else {
      // Rounded rectangle
      if (borderRadius > 0 && ctx.roundRect) {
        ctx.roundRect(x, y, width, height, borderRadius);
      } else {
        ctx.rect(x, y, width, height);
      }
      ctx.fill();
      if (strokeColor && strokeWidth) ctx.stroke();
    }
  }

  private static drawBadge(ctx: CanvasRenderingContext2D, layer: BadgeLayer, locale: LocaleCode): void {
    const { x, y, width, height, iconColor, bgColor, borderRadius = 8, label, stringKey } = layer;
    const resolvedLabel = resolveContent(stringKey || label, locale);

    // Background pill
    ctx.fillStyle = bgColor;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }

    // Icon Circle or Mark
    ctx.fillStyle = iconColor;
    const iconSize = Math.min(height * 0.45, 24);
    const iconX = x + 16;
    const iconY = y + height / 2;

    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Text Label
    if (resolvedLabel && layer.layout !== 'icon-only') {
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${Math.max(12, Math.round(height * 0.3))}px "Plus Jakarta Sans", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(resolvedLabel, iconX + iconSize + 12, iconY);
    }
  }

  private static drawText(ctx: CanvasRenderingContext2D, layer: TextLayer, locale: LocaleCode): void {
    const content = resolveContent(layer.stringKey || layer.text, locale);
    if (!content) return;

    const { x, y, width, fontSize, fontFamily, fontWeight, color, textAlign, lineHeight = 1.3 } = layer;

    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = 'top';

    // Alignment handling
    let targetX = x;
    if (textAlign === 'center') {
      targetX = x + width / 2;
      ctx.textAlign = 'center';
    } else if (textAlign === 'right') {
      targetX = x + width;
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'left';
    }

    // Basic word wrapping
    const words = content.split(' ');
    let currentLine = '';
    let currentY = y;
    const lineSpacing = fontSize * lineHeight;

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width && i > 0) {
        ctx.fillText(currentLine, targetX, currentY);
        currentLine = words[i];
        currentY += lineSpacing;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, targetX, currentY);
    }
  }

  private static drawQrCode(ctx: CanvasRenderingContext2D, layer: QrLayer): void {
    const { x, y, width, height, fgColor, bgColor, label } = layer;

    // Draw QR background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    // Draw stylized QR matrix pattern with corner positioning squares
    ctx.fillStyle = fgColor;
    const padding = Math.round(width * 0.1);
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const gridSize = 21;
    const cellW = innerW / gridSize;
    const cellH = innerH / gridSize;

    const startX = x + padding;
    const startY = y + padding;

    // Pseudo-random deterministic generator based on value hash
    let hash = 0;
    for (let i = 0; i < layer.value.length; i++) {
      hash = (hash << 5) - hash + layer.value.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Corner 7x7 marker blocks
        const isTopLeft = r < 7 && c < 7;
        const isTopRight = r < 7 && c >= gridSize - 7;
        const isBottomLeft = r >= gridSize - 7 && c < 7;

        if (isTopLeft || isTopRight || isBottomLeft) {
          const localR = isBottomLeft ? r - (gridSize - 7) : r;
          const localC = isTopRight ? c - (gridSize - 7) : c;
          if (
            localR === 0 ||
            localR === 6 ||
            localC === 0 ||
            localC === 6 ||
            (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4)
          ) {
            ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW - 0.5, cellH - 0.5);
          }
        } else {
          // Data modules
          const pseudoBit = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 999)) > 0.5;
          if (pseudoBit) {
            ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW - 0.5, cellH - 0.5);
          }
        }
      }
    }

    // Label below QR if present
    if (label) {
      ctx.fillStyle = fgColor;
      ctx.font = `600 12px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x + width / 2, y + height - 16);
    }
  }

  private static async drawImage(ctx: CanvasRenderingContext2D, layer: ImageLayer): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = layer.src;
    });
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '\'':
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }
}
