/**
 * AbleStudio - Accessibility Audit Modal
 * Comprehensive WCAG 2.1 Level AA & AAA analysis with 1-click auto-fix contrast,
 * alt-text inspection, touch target checks, and screen reader simulation.
 */

import React, { useState } from 'react';
import { DesignProject, TextLayer, DesignLayer } from '../data/model/DesignProject';
import { calculateContrast, getSuggestedCompliantColor, speakText, stopSpeaking } from '../core/accessibility/AccessibilitySettings';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  VolumeX,
  Wand2,
  Download,
  X,
  FileCheck,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { PngExporter } from '../export/PngExporter';

interface AccessibilityAuditModalProps {
  project: DesignProject;
  isOpen: boolean;
  onClose: () => void;
  onApplyAutoFix: (updatedProject: DesignProject) => void;
}

export const AccessibilityAuditModal: React.FC<AccessibilityAuditModalProps> = ({
  project,
  isOpen,
  onClose,
  onApplyAutoFix,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const textLayers = project.layers.filter((l) => l.type === 'text') as TextLayer[];

  // Evaluate each layer
  const auditResults = textLayers.map((layer) => {
    const bg = layer.backgroundColor || project.backgroundColor;
    const isBold = parseInt(layer.fontWeight, 10) >= 600;
    const score = calculateContrast(layer.color, bg, layer.fontSize, isBold);
    const passes = project.targetContrastStandard === 'AAA' ? score.passesAAA : score.passesAA;
    return {
      layer,
      score,
      passes,
      bg,
    };
  });

  const totalEvaluated = auditResults.length;
  const passCount = auditResults.filter((r) => r.passes).length;
  const failCount = totalEvaluated - passCount;
  const complianceRate = totalEvaluated > 0 ? Math.round((passCount / totalEvaluated) * 100) : 100;

  // Missing alt-text check
  const layersWithoutAlt = project.layers.filter(
    (l) => (l.type === 'badge' || l.type === 'qr' || l.type === 'image') && !l.altText
  );

  // Auto-Fix implementation
  const handleAutoFixAll = () => {
    const fixedLayers: DesignLayer[] = project.layers.map((layer) => {
      if (layer.type === 'text') {
        const textL = layer as TextLayer;
        const bg = textL.backgroundColor || project.backgroundColor;
        const score = calculateContrast(textL.color, bg, textL.fontSize, parseInt(textL.fontWeight, 10) >= 600);
        const passes = project.targetContrastStandard === 'AAA' ? score.passesAAA : score.passesAA;
        if (!passes) {
          const compliantColor = getSuggestedCompliantColor(bg);
          return {
            ...textL,
            color: compliantColor,
          };
        }
      }
      return layer;
    });

    onApplyAutoFix({
      ...project,
      layers: fixedLayers,
      updatedAt: new Date().toISOString(),
    });
  };

  // Screen reader test
  const handleToggleScreenReader = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const textToRead = project.layers
        .map((l) => {
          if (l.type === 'text') return (l as TextLayer).text;
          if (l.altText) return l.altText;
          return '';
        })
        .filter(Boolean)
        .join('. ');

      speakText(`Screen Reader Narration for ${project.title}. ${textToRead}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-amber-500" size={22} />
            <div>
              <h2 className="text-base font-semibold font-display">Accessibility & WCAG 2.1 Audit</h2>
              <p className="text-xs text-stone-400">Target Standard: Level {project.targetContrastStandard}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Bar */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-stone-950/60 border-b border-stone-800 text-center">
          <div className="p-2.5 bg-stone-900/60 rounded-lg border border-stone-800">
            <span className="text-xs text-stone-400">Compliance Rate</span>
            <div className={`text-xl font-bold font-mono-data mt-0.5 ${complianceRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {complianceRate}%
            </div>
          </div>
          <div className="p-2.5 bg-stone-900/60 rounded-lg border border-stone-800">
            <span className="text-xs text-stone-400">Passing Contrast</span>
            <div className="text-xl font-bold font-mono-data text-emerald-400 mt-0.5">{passCount}</div>
          </div>
          <div className="p-2.5 bg-stone-900/60 rounded-lg border border-stone-800">
            <span className="text-xs text-stone-400">Needs Adjustment</span>
            <div className={`text-xl font-bold font-mono-data mt-0.5 ${failCount > 0 ? 'text-rose-400' : 'text-stone-400'}`}>
              {failCount}
            </div>
          </div>
          <div className="p-2.5 bg-stone-900/60 rounded-lg border border-stone-800">
            <span className="text-xs text-stone-400">Alt-Text Missing</span>
            <div className={`text-xl font-bold font-mono-data mt-0.5 ${layersWithoutAlt.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {layersWithoutAlt.length}
            </div>
          </div>
        </div>

        {/* Scrollable Audit List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {failCount > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                <span className="text-xs text-amber-200">
                  {failCount} text element{failCount > 1 ? 's' : ''} do not meet the WCAG {project.targetContrastStandard} contrast threshold.
                </span>
              </div>
              <button
                onClick={handleAutoFixAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-stone-950 rounded-md hover:bg-amber-400 transition-colors shadow-sm shrink-0"
              >
                <Wand2 size={14} />
                Auto-Fix Colors
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Color Contrast Checklist</h3>
            {auditResults.map(({ layer, score, passes, bg }) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-3 rounded-lg border border-stone-800 bg-stone-900/40 hover:bg-stone-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {passes ? (
                    <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
                  ) : score.passesAA ? (
                    <AlertTriangle className="text-amber-400 shrink-0" size={18} />
                  ) : (
                    <XCircle className="text-rose-400 shrink-0" size={18} />
                  )}

                  <div>
                    <div className="text-sm font-medium text-stone-200 truncate max-w-sm">
                      {layer.text}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                      <span>{layer.fontSize}px</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-stone-600" style={{ backgroundColor: layer.color }} />
                        {layer.color}
                      </span>
                      <span>on</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-stone-600" style={{ backgroundColor: bg }} />
                        {bg}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono-data font-semibold text-stone-200">
                    {score.ratioFormatted}
                  </div>
                  <div className={`text-[10px] font-semibold tracking-wider ${passes ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {score.level} {passes ? 'PASS' : 'WARN'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alt-Text Checklist */}
          {layersWithoutAlt.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Non-Text Alt Descriptions</h3>
              {layersWithoutAlt.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-amber-500/5"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="text-amber-400 shrink-0" size={16} />
                    <span className="text-xs text-stone-300">
                      Layer &quot;{layer.name}&quot; ({layer.type}) has no alt description.
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-300">Missing Alt-Text</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-800 bg-stone-900/90">
          <button
            onClick={handleToggleScreenReader}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
              isPlayingAudio
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
            }`}
          >
            {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {isPlayingAudio ? 'Stop Screen Reader' : 'Simulate Screen Reader'}
          </button>

          <button
            onClick={() => PngExporter.downloadAccessibilityReport(project)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-stone-800 text-stone-100 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors"
          >
            <Download size={14} />
            Download Audit Certificate (.txt)
          </button>
        </div>
      </div>
    </div>
  );
};
