/**
 * Core data models for the Timeline Planner application
 */

export interface Project {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  color?: string;
  milestones: Milestone[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  color?: string;
  completed: boolean;
  status?: 'completed' | 'at_risk' | 'on_track' | 'not_started';
  tasks: Task[];
  dependencies?: string[]; // Array of milestone IDs that this milestone depends on
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  completed: boolean;
  assignee?: string;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type TimelineViewType = 'gantt' | 'calendar' | 'list';

export type TimeScaleType = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface TimelineSettings {
  viewType: TimelineViewType;
  showCompletedItems: boolean;
  groupBy: 'none' | 'project' | 'assignee' | 'tag';
  timeScale: TimeScaleType;
  hiddenProjectIds?: string[]; // Added for hiding projects
}
