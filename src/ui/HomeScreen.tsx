/**
 * AbleStudio - Home Screen Dashboard (TypeScript port of ui/HomeScreen.kt)
 * Project management, template catalog gallery, accessible canvas presets,
 * and quick-start actions.
 */

import React, { useState } from 'react';
import { DesignProject, CANVAS_PRESETS, CanvasPreset } from '../data/model/DesignProject';
import { TEMPLATE_CATALOG } from '../templates/TemplateCatalog';
import { ProjectRepository } from '../data/repository/ProjectRepository';
import { PngExporter } from '../export/PngExporter';
import { ArchitectureViewerModal } from '../editor/ArchitectureViewerModal';

import {
  Plus,
  Sparkles,
  ShieldCheck,
  Languages,
  Smartphone,
  Eye,
  Copy,
  Trash2,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  ArrowRight,
  Heart,
  Square,
  FileText,
  CreditCard,
} from 'lucide-react';

interface HomeScreenProps {
  onOpenProject: (project: DesignProject) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<DesignProject[]>(() => ProjectRepository.getAllProjects());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const refreshProjects = () => {
    setProjects(ProjectRepository.getAllProjects());
  };

  const handleCreateFromPreset = (preset: CanvasPreset) => {
    const newProj = ProjectRepository.createFromPreset(preset);
    refreshProjects();
    onOpenProject(newProj);
  };

  const handleOpenTemplate = (templateProject: DesignProject) => {
    // Clone template into a fresh user project
    const newProj: DesignProject = {
      ...templateProject,
      id: `proj-${Date.now()}`,
      title: `${templateProject.title} (New)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ProjectRepository.saveProject(newProj);
    refreshProjects();
    onOpenProject(newProj);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      ProjectRepository.deleteProject(id);
      refreshProjects();
    }
  };

  const handleDuplicateProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup = ProjectRepository.duplicateProject(id);
    if (dup) {
      refreshProjects();
    }
  };

  const handleQuickDownload = async (project: DesignProject, e: React.MouseEvent) => {
    e.stopPropagation();
    await PngExporter.exportToPng(project, 2);
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATE_CATALOG
      : TEMPLATE_CATALOG.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-lg shadow-md">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display tracking-tight text-white">AbleStudio</h1>
                <span className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  WCAG 2.1 AAA
                </span>
              </div>
              <p className="text-xs text-stone-400">Accessible Graphic Design & Localization Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            >
              <Smartphone size={14} className="text-amber-400" />
              <span>Android Architecture</span>
            </button>

            <button
              onClick={() => setShowPresetModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>New Canvas</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-stone-800 p-8 overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold tracking-wider uppercase">
              <ShieldCheck size={16} />
              <span>Universal Accessibility by Design</span>
            </div>
            <h2 className="text-3xl font-extrabold font-display text-white tracking-tight">
              Design posters, flyers, and social cards that everyone can perceive and understand.
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              AbleStudio brings real-time WCAG 2.1 color contrast calculation, optical vision deficiency simulation,
              sensory-friendly palettes, and multi-language string localization into one intuitive creative workstation.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowPresetModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Start Blank Project</span>
              </button>
              <button
                onClick={() => handleOpenTemplate(TEMPLATE_CATALOG[0].project)}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-lg border border-stone-700 transition-colors"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Open Featured Summit Poster</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Recent Projects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-white">Recent Projects</h3>
              <p className="text-xs text-stone-400">Saved in your local workspace</p>
            </div>
            <span className="text-xs text-stone-500 font-mono-data">{projects.length} designs</span>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj)}
                  className="group cursor-pointer rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 hover:shadow-xl transition-all overflow-hidden flex flex-col"
                >
                  {/* Canvas Thumbnail Preview Box */}
                  <div
                    className="h-44 w-full relative flex items-center justify-center p-4 overflow-hidden border-b border-stone-800"
                    style={{ backgroundColor: proj.backgroundColor }}
                  >
                    {/* Simplified miniature preview */}
                    <div className="w-full h-full flex flex-col justify-between p-2 select-none pointer-events-none">
                      <div className="text-xs font-bold truncate" style={{ color: proj.layers.find((l) => l.type === 'text')?.color || '#fff' }}>
                        {proj.title}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur">
                          {proj.width} × {proj.height}
                        </span>
                        <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 backdrop-blur">
                          {proj.locale.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Info & Actions */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="font-semibold text-sm text-stone-100 group-hover:text-amber-300 transition-colors truncate">
                        {proj.title}
                      </div>
                      <div className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                        {proj.description || 'No description provided'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-xs">
                      <span className="text-[11px] text-stone-500">
                        {proj.layers.length} layers
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleQuickDownload(proj, e)}
                          className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                          title="Quick Export PNG"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDuplicateProject(proj.id, e)}
                          className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                          title="Duplicate Project"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-stone-800 rounded-xl bg-stone-900/30">
              <p className="text-sm text-stone-400">No design projects found. Choose a template or create a new canvas below.</p>
            </div>
          )}
        </section>

        {/* 4. Accessible Templates Catalog */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold font-display text-white">Accessible Templates Catalog</h3>
              <p className="text-xs text-stone-400">Pre-audited for WCAG AAA compliance and multi-language support</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory('summit')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedCategory === 'summit'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Summit & Events
              </button>
              <button
                onClick={() => setSelectedCategory('sensory')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedCategory === 'sensory'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Sensory Friendly
              </button>
              <button
                onClick={() => setSelectedCategory('hiring')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedCategory === 'hiring'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Inclusive Hiring
              </button>
              <button
                onClick={() => setSelectedCategory('safety')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedCategory === 'safety'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                High Visibility Safety
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleOpenTemplate(template.project)}
                className="group cursor-pointer rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500 hover:shadow-xl transition-all overflow-hidden flex flex-col"
              >
                <div
                  className="h-48 w-full p-4 flex flex-col justify-between relative border-b border-stone-800"
                  style={{ backgroundColor: template.project.backgroundColor }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      WCAG {template.contrastGuarantee}
                    </span>
                    <span className="text-[10px] font-mono-data text-stone-400 bg-stone-950/70 px-1.5 py-0.5 rounded">
                      {template.project.width}×{template.project.height}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white line-clamp-2">
                      {template.title}
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-stone-400 line-clamp-2">
                      {template.description}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                    <span className="text-[11px] text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Customize <ArrowRight size={13} />
                    </span>
                    <span className="text-[10px] text-stone-500">{template.tags[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 5. Canvas Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold font-display text-white">Select Artboard Dimensions</h3>
              <button
                onClick={() => setShowPresetModal(false)}
                className="text-stone-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {CANVAS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setShowPresetModal(false);
                    handleCreateFromPreset(preset);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-stone-800 hover:border-amber-500 bg-stone-950/50 hover:bg-stone-900 text-left transition-colors"
                >
                  <div>
                    <div className="font-semibold text-xs text-stone-200">{preset.name}</div>
                    <div className="text-[11px] text-stone-500 uppercase font-mono-data mt-0.5">
                      {preset.category}
                    </div>
                  </div>
                  <span className="font-mono-data text-xs text-amber-400 font-medium">
                    {preset.width} × {preset.height} px
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Android Architecture Modal */}
      <ArchitectureViewerModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
};
