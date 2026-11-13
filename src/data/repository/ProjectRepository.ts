/**
 * AbleStudio - Project Repository (TypeScript port of data/repository/ProjectRepository.kt)
 * Handles persistence, autosave, revision history, and project templating.
 */

import { DesignProject, CanvasPreset } from '../model/DesignProject';
import { TEMPLATE_CATALOG } from '../../templates/TemplateCatalog';

const STORAGE_KEY = 'able_studio_projects_v1';
const ACTIVE_PROJECT_ID_KEY = 'able_studio_active_id_v1';

export class ProjectRepository {
  /**
   * Retrieves all saved projects, bootstrapping with initial templates if empty.
   */
  static getAllProjects(): DesignProject[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved projects, initializing defaults', e);
    }

    // Default bootstrap: convert template catalog projects into user projects
    const defaults: DesignProject[] = TEMPLATE_CATALOG.map((tpl) => ({
      ...tpl.project,
      id: `proj-${tpl.id}`,
      title: tpl.title,
      updatedAt: new Date().toISOString(),
    }));

    this.saveAllProjects(defaults);
    return defaults;
  }

  static saveAllProjects(projects: DesignProject[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }

  static getProjectById(id: string): DesignProject | null {
    const list = this.getAllProjects();
    return list.find((p) => p.id === id) || null;
  }

  static saveProject(project: DesignProject): void {
    const list = this.getAllProjects();
    const index = list.findIndex((p) => p.id === project.id);
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }

    this.saveAllProjects(list);
    this.setActiveProjectId(project.id);
  }

  static deleteProject(id: string): void {
    const list = this.getAllProjects().filter((p) => p.id !== id);
    this.saveAllProjects(list);
  }

  static duplicateProject(id: string): DesignProject | null {
    const original = this.getProjectById(id);
    if (!original) return null;

    const copy: DesignProject = {
      ...original,
      id: `proj-${Date.now()}`,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveProject(copy);
    return copy;
  }

  static createFromPreset(preset: CanvasPreset, title?: string): DesignProject {
    const newProj: DesignProject = {
      id: `proj-${Date.now()}`,
      title: title || `Untitled ${preset.name}`,
      description: 'New accessible design project created with AbleStudio',
      width: preset.width,
      height: preset.height,
      backgroundColor: '#0c0a09',
      locale: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Custom', preset.category],
      targetContrastStandard: 'AAA',
      layers: [
        {
          id: `layer-${Date.now()}-1`,
          type: 'text',
          name: 'Main Heading',
          text: 'Accessible Design for Everyone',
          x: Math.round(preset.width * 0.08),
          y: Math.round(preset.height * 0.15),
          width: Math.round(preset.width * 0.84),
          height: 120,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          fontSize: Math.min(48, Math.round(preset.width * 0.06)),
          fontFamily: 'Outfit',
          fontWeight: '800',
          color: '#ffffff',
          textAlign: 'left',
          lineHeight: 1.2,
          letterSpacing: -0.5,
          semanticRole: 'h1',
          altText: 'Heading: Accessible Design for Everyone',
        },
        {
          id: `layer-${Date.now()}-2`,
          type: 'text',
          name: 'Body Description',
          text: 'Built with high-contrast color balance, clear readable typography, and universal screen reader compatibility.',
          x: Math.round(preset.width * 0.08),
          y: Math.round(preset.height * 0.32),
          width: Math.round(preset.width * 0.84),
          height: 90,
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          fontSize: Math.min(20, Math.round(preset.width * 0.026)),
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: '400',
          color: '#cbd5e1',
          textAlign: 'left',
          lineHeight: 1.5,
          letterSpacing: 0,
          semanticRole: 'body',
          altText: 'Body text describing high contrast and screen reader compatibility',
        },
        {
          id: `layer-${Date.now()}-3`,
          type: 'badge',
          name: 'Accessibility Badge',
          x: Math.round(preset.width * 0.08),
          y: Math.round(preset.height * 0.48),
          width: 220,
          height: 52,
          rotation: 0,
          opacity: 1,
          zIndex: 3,
          icon: 'wheelchair',
          label: 'WCAG AAA Verified',
          iconColor: '#38bdf8',
          bgColor: '#0f172a',
          borderRadius: 12,
          layout: 'icon-and-label',
        },
      ],
    };

    this.saveProject(newProj);
    return newProj;
  }

  static getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  }

  static setActiveProjectId(id: string): void {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  }
}
