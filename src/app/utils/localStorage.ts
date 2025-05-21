'use client';

import { Project } from '../models/types';

// Local storage keys
const PROJECTS_KEY = 'timeline-planner-projects';
const SETTINGS_KEY = 'timeline-planner-settings';

/**
 * Save projects to local storage
 */
export const saveProjects = (projects: Project[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
};

/**
 * Load projects from local storage
 */
export const loadProjects = (): Project[] => {
  if (typeof window !== 'undefined') {
    const storedProjects = localStorage.getItem(PROJECTS_KEY);
    if (storedProjects) {
      try {
        return JSON.parse(storedProjects) as Project[];
      } catch (e) {
        console.error('Failed to parse projects from local storage:', e);
      }
    }
  }
  return [];
};

/**
 * Save settings to local storage
 */
export const saveSettings = <T>(settings: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

/**
 * Load settings from local storage
 */
export const loadSettings = <T>(defaultSettings: T): T => {
  if (typeof window !== 'undefined') {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings) as T;
      } catch (e) {
        console.error('Failed to parse settings from local storage:', e);
      }
    }
  }
  return defaultSettings;
};

/**
 * Clear all application data from local storage
 */
export const clearAllData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }
};
