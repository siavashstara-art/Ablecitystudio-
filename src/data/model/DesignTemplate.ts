/**
 * AbleStudio - Design Template Model (TypeScript port of data/model/DesignTemplate.kt)
 */

import { DesignProject } from './DesignProject';

export interface DesignTemplate {
  id: string;
  title: string;
  category: 'summit' | 'sensory' | 'hiring' | 'safety' | 'social' | 'pass';
  contrastGuarantee: 'AAA' | 'AA';
  description: string;
  project: DesignProject;
  tags: string[];
}
