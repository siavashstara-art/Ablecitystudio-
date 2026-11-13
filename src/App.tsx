/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HomeScreen } from './ui/HomeScreen';
import { EditorScreen } from './editor/EditorScreen';
import { DesignProject } from './data/model/DesignProject';
import { ProjectRepository } from './data/repository/ProjectRepository';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'editor'>('home');
  const [activeProject, setActiveProject] = useState<DesignProject | null>(() => {
    const activeId = ProjectRepository.getActiveProjectId();
    if (activeId) {
      return ProjectRepository.getProjectById(activeId);
    }
    return null;
  });

  const handleOpenProject = (project: DesignProject) => {
    setActiveProject(project);
    ProjectRepository.setActiveProjectId(project.id);
    setCurrentScreen('editor');
  };

  const handleNavigateHome = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="w-full h-full min-h-screen bg-stone-950 text-stone-100">
      {currentScreen === 'home' || !activeProject ? (
        <HomeScreen onOpenProject={handleOpenProject} />
      ) : (
        <EditorScreen
          key={activeProject.id}
          initialProject={activeProject}
          onNavigateHome={handleNavigateHome}
        />
      )}
    </div>
  );
}
