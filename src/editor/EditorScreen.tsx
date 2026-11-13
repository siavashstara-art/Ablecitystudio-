/**
 * AbleStudio - Main Editor Screen (TypeScript port of editor/EditorScreen.kt)
 * Full accessible graphic design studio with live canvas, property inspector,
 * optical vision simulators, WCAG contrast meters, and multi-language controls.
 */

import React, { useState, useEffect } from 'react';
import {
  DesignProject,
  DesignLayer,
  TextLayer,
  ShapeLayer,
  BadgeLayer,
  QrLayer,
  CANVAS_PRESETS,
} from '../data/model/DesignProject';
import { DesignRenderer } from './DesignRenderer';
import { ProjectRepository } from '../data/repository/ProjectRepository';
import {
  VisionSimulationType,
  VISION_SIMULATION_CONFIGS,
  calculateContrast,
  getSuggestedCompliantColor,
  speakText,
  stopSpeaking,
} from '../core/accessibility/AccessibilitySettings';
import {
  LocaleCode,
  SUPPORTED_LOCALES,
  STRING_RESOURCES,
} from '../core/localization/LocalizationEngine';
import { ACCESSIBLE_COLOR_PAIRS, OKABE_ITO_PALETTE, TYPOGRAPHY_FONTS } from '../ui/theme/AppTheme';
import { PngExporter } from '../export/PngExporter';
import { AccessibilityAuditModal } from './AccessibilityAuditModal';
import { LocalizationModal } from './LocalizationModal';
import { ArchitectureViewerModal } from './ArchitectureViewerModal';

import {
  ArrowLeft,
  Eye,
  ShieldCheck,
  Languages,
  Download,
  Plus,
  Type,
  Square,
  Award,
  QrCode,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Smartphone,
  Check,
  Undo2,
  Redo2,
  Sparkles,
} from 'lucide-react';

interface EditorScreenProps {
  initialProject: DesignProject;
  onNavigateHome: () => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({ initialProject, onNavigateHome }) => {
  const [project, setProject] = useState<DesignProject>(initialProject);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.75);
  const [visionSimulation, setVisionSimulation] = useState<VisionSimulationType>('none');
  const [dyslexiaMode, setDyslexiaMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'layers'>('tools');

  // History stack for Undo/Redo
  const [historyPast, setHistoryPast] = useState<DesignProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<DesignProject[]>([]);

  // Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-fit zoom on mount
  useEffect(() => {
    const handleResize = () => {
      const availableW = window.innerWidth - 650;
      const availableH = window.innerHeight - 150;
      if (availableW > 0 && availableH > 0) {
        const scaleW = availableW / project.width;
        const scaleH = availableH / project.height;
        const fitted = Math.min(scaleW, scaleH, 1.0);
        setZoom(Math.max(0.35, Math.round(fitted * 100) / 100));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [project.width, project.height]);

  // Push to history before state mutation
  const pushHistory = (currentProj: DesignProject) => {
    setHistoryPast((prev) => [...prev.slice(-25), currentProj]);
    setHistoryFuture([]);
  };

  const updateProject = (newProj: DesignProject, recordHistory: boolean = true) => {
    if (recordHistory) {
      pushHistory(project);
    }
    setProject(newProj);
    ProjectRepository.saveProject(newProj);
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [project, ...prev]);
    setProject(previous);
    ProjectRepository.saveProject(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, project]);
    setProject(next);
    ProjectRepository.saveProject(next);
  };

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId) || null;

  // Layer Update
  const handleUpdateLayer = (updated: DesignLayer) => {
    const updatedLayers = project.layers.map((l) => (l.id === updated.id ? updated : l));
    updateProject({ ...project, layers: updatedLayers }, false);
  };

  // Layer Creation Helpers
  const addTextLayer = (role: 'h1' | 'h2' | 'body' | 'callout') => {
    const defaultProps = {
      h1: { fontSize: 44, fontWeight: '800' as const, text: 'Bold Accessible Headline', w: 500, h: 70 },
      h2: { fontSize: 28, fontWeight: '700' as const, text: 'Informative Section Subheading', w: 450, h: 50 },
      body: { fontSize: 18, fontWeight: '400' as const, text: 'Clear, high-legibility body description formatted for universal access.', w: 450, h: 80 },
      callout: { fontSize: 20, fontWeight: '700' as const, text: 'IMPORTANT NOTICE · READ HERE', w: 400, h: 40 },
    }[role];

    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: `${role.toUpperCase()} Text`,
      x: Math.round(project.width * 0.1),
      y: Math.round(project.height * 0.2 + (project.layers.length * 25) % 200),
      width: defaultProps.w,
      height: defaultProps.h,
      rotation: 0,
      opacity: 1,
      zIndex: project.layers.length + 1,
      text: defaultProps.text,
      fontSize: defaultProps.fontSize,
      fontFamily: role === 'h1' ? 'Outfit' : 'Plus Jakarta Sans',
      fontWeight: defaultProps.fontWeight,
      color: project.backgroundColor.toLowerCase() === '#ffffff' ? '#0a0a0a' : '#ffffff',
      textAlign: 'left',
      lineHeight: 1.3,
      letterSpacing: 0,
      semanticRole: role,
      altText: defaultProps.text,
    };

    updateProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
  };

  const addShapeLayer = (shapeKind: 'rectangle' | 'circle' | 'pill') => {
    const isCircle = shapeKind === 'circle';
    const newLayer: ShapeLayer = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      name: `${shapeKind.charAt(0).toUpperCase() + shapeKind.slice(1)} Shape`,
      shapeKind,
      x: Math.round(project.width * 0.15),
      y: Math.round(project.height * 0.25),
      width: isCircle ? 140 : 380,
      height: isCircle ? 140 : shapeKind === 'pill' ? 56 : 180,
      rotation: 0,
      opacity: 1,
      zIndex: project.layers.length + 1,
      fillColor: '#1e293b',
      strokeColor: '#334155',
      strokeWidth: 1.5,
      borderRadius: shapeKind === 'pill' ? 28 : isCircle ? 0 : 16,
    };

    updateProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
  };

  const addBadgeLayer = (icon: any, label: string) => {
    const newLayer: BadgeLayer = {
      id: `badge-${Date.now()}`,
      type: 'badge',
      name: `${label} Badge`,
      x: Math.round(project.width * 0.1),
      y: Math.round(project.height * 0.5),
      width: 220,
      height: 50,
      rotation: 0,
      opacity: 1,
      zIndex: project.layers.length + 1,
      icon,
      label,
      iconColor: '#38bdf8',
      bgColor: '#0f172a',
      borderRadius: 12,
      layout: 'icon-and-label',
      altText: `Accessibility Badge: ${label}`,
    };

    updateProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
  };

  const addQrLayer = () => {
    const newLayer: QrLayer = {
      id: `qr-${Date.now()}`,
      type: 'qr',
      name: 'Scan QR Link',
      x: Math.round(project.width * 0.1),
      y: Math.round(project.height * 0.6),
      width: 160,
      height: 160,
      rotation: 0,
      opacity: 1,
      zIndex: project.layers.length + 1,
      value: 'https://able.studio',
      label: 'Scan with Camera',
      fgColor: '#0a0a0a',
      bgColor: '#ffffff',
      altText: 'QR Code linking to able.studio',
    };

    updateProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
  };

  const deleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    const remaining = project.layers.filter((l) => l.id !== selectedLayerId);
    updateProject({ ...project, layers: remaining });
    setSelectedLayerId(null);
  };

  const duplicateSelectedLayer = () => {
    if (!selectedLayer) return;
    const dup: DesignLayer = {
      ...selectedLayer,
      id: `layer-${Date.now()}`,
      name: `${selectedLayer.name} (Copy)`,
      x: selectedLayer.x + 20,
      y: selectedLayer.y + 20,
      zIndex: project.layers.length + 1,
    };
    updateProject({ ...project, layers: [...project.layers, dup] });
    setSelectedLayerId(dup.id);
  };

  const changeLayerZIndex = (direction: 'up' | 'down') => {
    if (!selectedLayer) return;
    const newLayers = [...project.layers];
    const idx = newLayers.findIndex((l) => l.id === selectedLayer.id);
    if (idx < 0) return;

    if (direction === 'up' && idx < newLayers.length - 1) {
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[idx + 1];
      newLayers[idx + 1] = temp;
    } else if (direction === 'down' && idx > 0) {
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[idx - 1];
      newLayers[idx - 1] = temp;
    }

    // Reassign incremental zIndexes
    newLayers.forEach((l, i) => {
      l.zIndex = i + 1;
    });

    updateProject({ ...project, layers: newLayers });
  };

  // Screen reader simulation speech toggle
  const handleToggleAudio = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const narration = project.layers
        .map((l) => {
          if (l.type === 'text') return (l as TextLayer).text;
          if (l.altText) return l.altText;
          return '';
        })
        .filter(Boolean)
        .join('. ');
      speakText(`Design canvas overview: ${narration}`);
    }
  };

  // Contrast calculation for currently selected text layer
  const activeContrast =
    selectedLayer && selectedLayer.type === 'text'
      ? calculateContrast(
          (selectedLayer as TextLayer).color,
          (selectedLayer as TextLayer).backgroundColor || project.backgroundColor,
          (selectedLayer as TextLayer).fontSize,
          parseInt((selectedLayer as TextLayer).fontWeight, 10) >= 600
        )
      : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 font-sans">
      {/* 1. TOP STUDIO APP BAR */}
      <header className="h-14 border-b border-stone-800 bg-stone-900/90 backdrop-blur px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-300 hover:text-white rounded-md hover:bg-stone-800 transition-colors"
            title="Return to Home Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Projects</span>
          </button>

          <span className="text-stone-700" aria-hidden="true">|</span>

          {/* Project Title Editor */}
          <input
            type="text"
            value={project.title}
            onChange={(e) => updateProject({ ...project, title: e.target.value }, false)}
            className="bg-transparent hover:bg-stone-800/60 focus:bg-stone-800 text-sm font-semibold text-stone-100 px-2 py-1 rounded border border-transparent focus:border-stone-600 outline-none max-w-xs truncate"
          />

          <span className="text-xs text-stone-500 font-mono-data">
            {project.width}×{project.height}
          </span>
        </div>

        {/* Center: Accessibility & Vision Controls */}
        <div className="flex items-center gap-2">
          {/* Vision Simulator Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-950/70 border border-stone-800 rounded-lg p-1 text-xs">
            <Eye size={14} className="text-amber-400 ml-1.5" />
            <select
              value={visionSimulation}
              onChange={(e) => setVisionSimulation(e.target.value as VisionSimulationType)}
              className="bg-transparent text-stone-300 text-xs py-1 pr-2 outline-none cursor-pointer"
            >
              {VISION_SIMULATION_CONFIGS.map((cfg) => (
                <option key={cfg.id} value={cfg.id} className="bg-stone-900 text-stone-100">
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dyslexia Mode Toggle */}
          <button
            onClick={() => setDyslexiaMode(!dyslexiaMode)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              dyslexiaMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-dyslexic'
                : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle high-legibility dyslexic-friendly typography"
          >
            Dyslexia Font
          </button>

          {/* Active Locale Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-950/70 border border-stone-800 rounded-lg p-1 text-xs">
            <Languages size={14} className="text-amber-400 ml-1.5" />
            <select
              value={project.locale}
              onChange={(e) => updateProject({ ...project, locale: e.target.value as LocaleCode })}
              className="bg-transparent text-stone-300 text-xs py-1 pr-2 outline-none cursor-pointer"
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l.code} value={l.code} className="bg-stone-900 text-stone-100">
                  {l.flag} {l.nativeName} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* WCAG Audit Button */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
          >
            <ShieldCheck size={15} className="text-amber-400" />
            <span>WCAG Audit</span>
          </button>

          {/* Strings / Localization Inspector */}
          <button
            onClick={() => setIsLocModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg transition-colors"
            title="Inspect Android strings.xml dictionary and live translations"
          >
            <Languages size={14} />
            <span>Strings</span>
          </button>

          {/* Android Architecture Blueprint */}
          <button
            onClick={() => setIsArchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg transition-colors"
            title="View Kotlin & Jetpack Compose Android Architecture mapping"
          >
            <Smartphone size={14} />
            <span>Android Arch</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors shadow-sm"
            >
              <Download size={14} />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={async () => {
                    setShowExportMenu(false);
                    setIsExporting(true);
                    await PngExporter.exportToPng(project, 2);
                    setIsExporting(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-200 flex items-center justify-between"
                >
                  <span>PNG High-Res (2x Retina)</span>
                  <span className="text-[10px] text-stone-400 font-mono-data">PNG</span>
                </button>
                <button
                  onClick={async () => {
                    setShowExportMenu(false);
                    setIsExporting(true);
                    await PngExporter.exportToPng(project, 1);
                    setIsExporting(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-200 flex items-center justify-between"
                >
                  <span>PNG Standard (1x)</span>
                  <span className="text-[10px] text-stone-400 font-mono-data">PNG</span>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    PngExporter.exportToSvg(project);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-800 text-stone-200 flex items-center justify-between"
                >
                  <span>Vector Graphic (.svg)</span>
                  <span className="text-[10px] text-stone-400 font-mono-data">SVG</span>
                </button>
                <div className="my-1 border-t border-stone-800" />
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    PngExporter.downloadAccessibilityReport(project);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-800 text-amber-300 flex items-center justify-between"
                >
                  <span>Audit Certificate (.txt)</span>
                  <ShieldCheck size={13} className="text-amber-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (3 Columns) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PALETTE: Add Assets & Layers */}
        <aside className="w-64 border-r border-stone-800 bg-stone-900/60 flex flex-col shrink-0">
          {/* Tab Switcher */}
          <div className="flex border-b border-stone-800 text-xs bg-stone-950/40">
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'tools'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-stone-900/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Plus size={14} />
              <span>Add Elements</span>
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'layers'
                  ? 'border-b-2 border-amber-500 text-amber-400 bg-stone-900/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers size={14} />
              <span>Layers ({project.layers.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {activeTab === 'tools' ? (
              <>
                {/* Text section */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                    Typography Elements
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => addTextLayer('h1')}
                      className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors"
                    >
                      <div className="text-xs font-bold text-stone-200">Headline</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">H1 · 44px</div>
                    </button>
                    <button
                      onClick={() => addTextLayer('h2')}
                      className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors"
                    >
                      <div className="text-xs font-semibold text-stone-200">Subheading</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">H2 · 28px</div>
                    </button>
                    <button
                      onClick={() => addTextLayer('body')}
                      className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors"
                    >
                      <div className="text-xs font-medium text-stone-200">Body Copy</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">Paragraph · 18px</div>
                    </button>
                    <button
                      onClick={() => addTextLayer('callout')}
                      className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors"
                    >
                      <div className="text-xs font-bold text-amber-400">Callout</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">Important Tag</div>
                    </button>
                  </div>
                </div>

                {/* Shape section */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                    Shapes & Containers
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => addShapeLayer('rectangle')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-center transition-colors text-xs text-stone-300"
                    >
                      <Square size={16} className="mx-auto mb-1 text-stone-400" />
                      Card
                    </button>
                    <button
                      onClick={() => addShapeLayer('circle')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-center transition-colors text-xs text-stone-300"
                    >
                      <div className="w-4 h-4 rounded-full border border-stone-400 mx-auto mb-1" />
                      Circle
                    </button>
                    <button
                      onClick={() => addShapeLayer('pill')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-center transition-colors text-xs text-stone-300"
                    >
                      <div className="w-5 h-3 rounded-full border border-stone-400 mx-auto mb-1" />
                      Pill
                    </button>
                  </div>
                </div>

                {/* Accessible Badges */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                    Accessible Badges
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => addBadgeLayer('wheelchair', 'Wheelchair Accessible')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors text-xs text-stone-300"
                    >
                      <span className="text-amber-400 font-semibold block text-[11px]">Wheelchair</span>
                      <span className="text-[10px] text-stone-500">Universal Access</span>
                    </button>
                    <button
                      onClick={() => addBadgeLayer('asl', 'ASL Interpreted')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors text-xs text-stone-300"
                    >
                      <span className="text-amber-400 font-semibold block text-[11px]">ASL / Sign</span>
                      <span className="text-[10px] text-stone-500">Live Interpreted</span>
                    </button>
                    <button
                      onClick={() => addBadgeLayer('audio-description', 'Audio Description')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors text-xs text-stone-300"
                    >
                      <span className="text-amber-400 font-semibold block text-[11px]">Audio Desc</span>
                      <span className="text-[10px] text-stone-500">Vision Assisted</span>
                    </button>
                    <button
                      onClick={() => addBadgeLayer('sensory', 'Sensory Friendly')}
                      className="p-2 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors text-xs text-stone-300"
                    >
                      <span className="text-amber-400 font-semibold block text-[11px]">Sensory Rest</span>
                      <span className="text-[10px] text-stone-500">Calm Environment</span>
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                    Interactive Modules
                  </div>
                  <button
                    onClick={addQrLayer}
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-left transition-colors text-xs text-stone-300"
                  >
                    <QrCode size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-200">Accessible QR Code</div>
                      <div className="text-[10px] text-stone-400">Direct camera link with alt text</div>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              /* Layers Reordering List */
              <div className="space-y-1">
                {[...project.layers].reverse().map((layer) => {
                  const isSelected = layer.id === selectedLayerId;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono-data text-stone-500 w-4">
                          {layer.zIndex}
                        </span>
                        <span className="truncate">{layer.name}</span>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => changeLayerZIndex('up')}
                            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-700"
                            title="Bring Forward"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => changeLayerZIndex('down')}
                            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-700"
                            title="Send Backward"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: Canvas Viewport & Stage */}
        <main className="flex-1 flex flex-col relative overflow-hidden canvas-checkerboard">
          {/* Vision Simulator Active Warning Banner */}
          {visionSimulation !== 'none' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-stone-900/90 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-full shadow-lg text-xs backdrop-blur">
              <Eye size={14} />
              <span>Simulating: <strong>{VISION_SIMULATION_CONFIGS.find((c) => c.id === visionSimulation)?.label}</strong></span>
              <button
                onClick={() => setVisionSimulation('none')}
                className="ml-2 text-stone-400 hover:text-white underline text-[11px]"
              >
                Reset
              </button>
            </div>
          )}

          {/* Scrollable Canvas Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <DesignRenderer
              project={project}
              activeLocale={project.locale}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={handleUpdateLayer}
              zoom={zoom}
              visionSimulation={visionSimulation}
              dyslexiaMode={dyslexiaMode}
            />
          </div>

          {/* Floating Bottom Canvas Toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-stone-900/90 border border-stone-800 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur text-xs z-20">
            {/* Undo / Redo */}
            <button
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:text-stone-400 rounded hover:bg-stone-800"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:text-stone-400 rounded hover:bg-stone-800"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={15} />
            </button>

            <span className="text-stone-700 mx-1">|</span>

            {/* Zoom Controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.2, Math.round((z - 0.1) * 10) / 10))}
              className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="font-mono-data text-stone-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
              className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800"
              title="Actual Size (100%)"
            >
              <Maximize2 size={15} />
            </button>

            <span className="text-stone-700 mx-1">|</span>

            {/* Screen Reader audio test */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                isSpeaking
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
              title="Auditory preview: listen to design elements as read by assistive technology"
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? 'Mute Audio' : 'Screen Reader'}</span>
            </button>
          </div>
        </main>

        {/* RIGHT PALETTE: Property Inspector & WCAG Contrast Meter */}
        <aside className="w-80 border-l border-stone-800 bg-stone-900/70 flex flex-col shrink-0 overflow-y-auto">
          {selectedLayer ? (
            <div className="p-4 space-y-5 text-xs">
              {/* Header with Title and Delete/Duplicate */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <div className="font-semibold text-stone-200">{selectedLayer.name}</div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider">{selectedLayer.type} layer</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={duplicateSelectedLayer}
                    className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800"
                    title="Duplicate Layer"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={deleteSelectedLayer}
                    className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                    title="Delete Layer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Geometry Controls (X, Y, W, H) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Position & Bounds</span>
                <div className="grid grid-cols-2 gap-2 font-mono-data">
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <span className="text-stone-500 text-[10px] w-5">X:</span>
                    <input
                      type="number"
                      value={selectedLayer.x}
                      onChange={(e) => handleUpdateLayer({ ...selectedLayer, x: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-transparent text-stone-200 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <span className="text-stone-500 text-[10px] w-5">Y:</span>
                    <input
                      type="number"
                      value={selectedLayer.y}
                      onChange={(e) => handleUpdateLayer({ ...selectedLayer, y: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-transparent text-stone-200 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <span className="text-stone-500 text-[10px] w-5">W:</span>
                    <input
                      type="number"
                      value={selectedLayer.width}
                      onChange={(e) => handleUpdateLayer({ ...selectedLayer, width: Math.max(20, parseInt(e.target.value, 10) || 20) })}
                      className="w-full bg-transparent text-stone-200 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <span className="text-stone-500 text-[10px] w-5">H:</span>
                    <input
                      type="number"
                      value={selectedLayer.height}
                      onChange={(e) => handleUpdateLayer({ ...selectedLayer, height: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                      className="w-full bg-transparent text-stone-200 outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE WCAG CONTRAST METER (If Text Layer) */}
              {activeContrast && (
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} className="text-amber-400" />
                      Contrast Ratio
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        activeContrast.passesAAA
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : activeContrast.passesAA
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {activeContrast.level} {activeContrast.passesAA ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold font-mono-data text-stone-100">
                      {activeContrast.ratioFormatted}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Target: Level {project.targetContrastStandard}
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-snug">
                    {activeContrast.recommendation}
                  </p>

                  {/* 1-Click Auto Compliant Button */}
                  {!activeContrast.passesAAA && (
                    <button
                      onClick={() => {
                        const bg = (selectedLayer as TextLayer).backgroundColor || project.backgroundColor;
                        const compliant = getSuggestedCompliantColor(bg);
                        handleUpdateLayer({
                          ...(selectedLayer as TextLayer),
                          color: compliant,
                        });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-amber-500 text-stone-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow"
                    >
                      <Sparkles size={13} />
                      Set WCAG AAA Compliant Color
                    </button>
                  )}
                </div>
              )}

              {/* Type-Specific Properties: TEXT */}
              {selectedLayer.type === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Content String
                    </label>
                    <textarea
                      rows={3}
                      value={(selectedLayer as TextLayer).text}
                      onChange={(e) =>
                        handleUpdateLayer({
                          ...(selectedLayer as TextLayer),
                          text: e.target.value,
                          altText: e.target.value,
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded p-2 text-stone-200 outline-none focus:border-amber-500/50 text-xs"
                    />
                  </div>

                  {/* String Key Binding (@string/...) */}
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Android String Binding (@string/...)
                    </label>
                    <select
                      value={(selectedLayer as TextLayer).stringKey || ''}
                      onChange={(e) =>
                        handleUpdateLayer({
                          ...(selectedLayer as TextLayer),
                          stringKey: e.target.value || undefined,
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-300 outline-none text-xs"
                    >
                      <option value="">None (Static text)</option>
                      {Object.keys(STRING_RESOURCES.en).map((key) => (
                        <option key={key} value={`@string/${key}`}>
                          @string/{key}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Typography Font & Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                        Font Family
                      </label>
                      <select
                        value={(selectedLayer as TextLayer).fontFamily}
                        onChange={(e) =>
                          handleUpdateLayer({
                            ...(selectedLayer as TextLayer),
                            fontFamily: e.target.value,
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-300 outline-none text-xs"
                      >
                        {TYPOGRAPHY_FONTS.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                        Font Size (px)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={(selectedLayer as TextLayer).fontSize}
                        onChange={(e) =>
                          handleUpdateLayer({
                            ...(selectedLayer as TextLayer),
                            fontSize: parseInt(e.target.value, 10) || 16,
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 outline-none text-xs font-mono-data"
                      />
                    </div>
                  </div>

                  {/* Text Color Picker & Presets */}
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(selectedLayer as TextLayer).color}
                        onChange={(e) =>
                          handleUpdateLayer({
                            ...(selectedLayer as TextLayer),
                            color: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border border-stone-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedLayer as TextLayer).color}
                        onChange={(e) =>
                          handleUpdateLayer({
                            ...(selectedLayer as TextLayer),
                            color: e.target.value,
                          })
                        }
                        className="flex-1 bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 font-mono-data text-xs"
                      />
                    </div>

                    {/* Okabe-Ito Colorblind Safe swatches */}
                    <div className="flex items-center gap-1 mt-2">
                      {OKABE_ITO_PALETTE.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => handleUpdateLayer({ ...(selectedLayer as TextLayer), color: c.hex })}
                          className="w-5 h-5 rounded-full border border-stone-700 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c.hex }}
                          title={`Okabe-Ito ${c.name} (${c.hex})`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type-Specific: SHAPE */}
              {selectedLayer.type === 'shape' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Fill Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(selectedLayer as ShapeLayer).fillColor}
                        onChange={(e) =>
                          handleUpdateLayer({
                            ...(selectedLayer as ShapeLayer),
                            fillColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border border-stone-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selectedLayer as ShapeLayer).fillColor}
                        onChange={(e) =>
                          handleUpdateLayer({
                            ...(selectedLayer as ShapeLayer),
                            fillColor: e.target.value,
                          })
                        }
                        className="flex-1 bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 font-mono-data text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      Corner Radius (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={(selectedLayer as ShapeLayer).borderRadius || 0}
                      onChange={(e) =>
                        handleUpdateLayer({
                          ...(selectedLayer as ShapeLayer),
                          borderRadius: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 font-mono-data text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Type-Specific: QR CODE */}
              {selectedLayer.type === 'qr' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                      QR Target URL
                    </label>
                    <input
                      type="text"
                      value={(selectedLayer as QrLayer).value}
                      onChange={(e) =>
                        handleUpdateLayer({
                          ...(selectedLayer as QrLayer),
                          value: e.target.value,
                          altText: `QR Code linking to ${e.target.value}`,
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Alt Text & Semantic Accessibility */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Screen Reader Alt-Text
                </label>
                <input
                  type="text"
                  value={selectedLayer.altText || ''}
                  placeholder="Describe element for assistive devices..."
                  onChange={(e) =>
                    handleUpdateLayer({
                      ...selectedLayer,
                      altText: e.target.value,
                    })
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 text-xs placeholder:text-stone-600"
                />
              </div>
            </div>
          ) : (
            /* Canvas & Document Settings when nothing is selected */
            <div className="p-4 space-y-5 text-xs">
              <div className="pb-3 border-b border-stone-800">
                <div className="font-semibold text-stone-200">Canvas Settings</div>
                <div className="text-[10px] text-stone-500">Global artboard configurations</div>
              </div>

              {/* Dimensions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Canvas Dimensions</span>
                <div className="grid grid-cols-2 gap-2 font-mono-data">
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <span className="text-stone-500 text-[10px] w-5">W:</span>
                    <input
                      type="number"
                      value={project.width}
                      onChange={(e) => updateProject({ ...project, width: parseInt(e.target.value, 10) || 800 })}
                      className="w-full bg-transparent text-stone-200 outline-none text-right"
                    />
                  </div>
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded px-2 py-1">
                    <span className="text-stone-500 text-[10px] w-5">H:</span>
                    <input
                      type="number"
                      value={project.height}
                      onChange={(e) => updateProject({ ...project, height: parseInt(e.target.value, 10) || 800 })}
                      className="w-full bg-transparent text-stone-200 outline-none text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Artboard Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={project.backgroundColor}
                    onChange={(e) => updateProject({ ...project, backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded border border-stone-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={project.backgroundColor}
                    onChange={(e) => updateProject({ ...project, backgroundColor: e.target.value })}
                    className="flex-1 bg-stone-950 border border-stone-800 rounded p-1.5 text-stone-200 font-mono-data text-xs"
                  />
                </div>
              </div>

              {/* Curated Accessible Color Palettes */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                  WCAG AAA Color Pairs
                </span>
                <div className="space-y-1.5">
                  {ACCESSIBLE_COLOR_PAIRS.slice(0, 4).map((pair) => (
                    <button
                      key={pair.name}
                      onClick={() => updateProject({ ...project, backgroundColor: pair.background })}
                      className="w-full flex items-center justify-between p-2 rounded border border-stone-800 hover:border-stone-700 text-left transition-colors"
                      style={{ backgroundColor: pair.background, color: pair.foreground }}
                    >
                      <span className="font-medium text-[11px] truncate">{pair.name}</span>
                      <span className="font-mono-data text-[10px] opacity-80">{pair.contrastRatio}:1 AAA</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <AccessibilityAuditModal
        project={project}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onApplyAutoFix={(fixedProj) => updateProject(fixedProj)}
      />

      <LocalizationModal
        project={project}
        activeLocale={project.locale}
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        onSelectLocale={(loc) => {
          updateProject({ ...project, locale: loc });
          setIsLocModalOpen(false);
        }}
      />

      <ArchitectureViewerModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
};
