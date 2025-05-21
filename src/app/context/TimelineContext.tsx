'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useMemo
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Milestone, Task, Tag, TimelineSettings, TimelineViewType } from '../models/types';
import { loadProjects, saveProjects, loadSettings, saveSettings } from '../utils/localStorage';

// Default timeline settings
const DEFAULT_SETTINGS: TimelineSettings = {
  viewType: 'gantt',
  showCompletedItems: true,
  groupBy: 'project',
  timeScale: 'week',
  hiddenProjectIds: [], // Initialize hiddenProjectIds
};

interface TimelineContextType {
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Milestones
  addMilestone: (projectId: string, milestone: Omit<Milestone, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'tasks'>) => Milestone;
  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;
  moveMilestone: (projectId: string, milestoneId: string, direction: 'up' | 'down') => void; // Added
  
  // Tasks
  addTask: (projectId: string, milestoneId: string, task: Omit<Task, 'id' | 'milestoneId' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (projectId: string, milestoneId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, milestoneId: string, taskId: string) => void;
  
  // Tags
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id'>) => Tag;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  
  // Settings
  settings: TimelineSettings;
  updateSettings: (updates: Partial<TimelineSettings>) => void;
  toggleProjectVisibility: (projectId: string) => void; // Added for toggling project visibility
  
  // Helpers
  getProjectById: (id: string) => Project | undefined;
  getMilestoneById: (id: string) => Milestone | undefined;
  isLoading: boolean;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const TimelineProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<TimelineSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadedProjects = loadProjects();
    setProjects(loadedProjects);

    // Extract all tags from projects
    const allTags: Tag[] = [];
    loadedProjects.forEach(project => {
      project.tags?.forEach(tag => {
        if (!allTags.some(t => t.id === tag.id)) {
          allTags.push(tag);
        }
      });

      project.milestones.forEach(milestone => {
        milestone.tasks.forEach(task => {
          task.tags?.forEach(tag => {
            if (!allTags.some(t => t.id === tag.id)) {
              allTags.push(tag);
            }
          });
        });
      });
    });
    
    setTags(allTags);
    
    // Load settings
    const loadedSettings = loadSettings<TimelineSettings>(DEFAULT_SETTINGS);
    setSettings(loadedSettings);
    
    setIsLoading(false);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveProjects(projects);
    }
  }, [projects, isLoading]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveSettings(settings);
    }
  }, [settings, isLoading]);

  // Projects CRUD
  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      milestones: [],
      createdAt: now,
      updatedAt: now
    };
    
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === id 
          ? { ...project, ...updates, updatedAt: new Date().toISOString() } 
          : project
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  // Milestones CRUD
  const addMilestone = (
    projectId: string, 
    milestone: Omit<Milestone, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'tasks'>
  ): Milestone => {
    const now = new Date().toISOString();
    const newMilestone: Milestone = {
      ...milestone,
      id: uuidv4(),
      projectId,
      tasks: [],
      createdAt: now,
      updatedAt: now
    };
    
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId
          ? { 
              ...project, 
              milestones: [...project.milestones, newMilestone],
              updatedAt: now 
            }
          : project
      )
    );
    
    return newMilestone;
  };

  const updateMilestone = (projectId: string, milestoneId: string, updates: Partial<Milestone>) => {
    const now = new Date().toISOString();
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              milestones: project.milestones.map(milestone => 
                milestone.id === milestoneId
                  ? { ...milestone, ...updates, updatedAt: now }
                  : milestone
              ),
              updatedAt: now
            }
          : project
      )
    );
  };

  const deleteMilestone = (projectId: string, milestoneId: string) => {
    const now = new Date().toISOString();
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              milestones: project.milestones.filter(milestone => milestone.id !== milestoneId),
              updatedAt: now
            }
          : project
      )
    );
  };

  const moveMilestone = (projectId: string, milestoneId: string, direction: 'up' | 'down') => {
    setProjects(prevProjects => {
      const projectIndex = prevProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) return prevProjects;

      const project = prevProjects[projectIndex];
      const milestoneIndex = project.milestones.findIndex(m => m.id === milestoneId);

      if (milestoneIndex === -1) return prevProjects;

      const newMilestones = [...project.milestones];
      const targetIndex = direction === 'up' ? milestoneIndex - 1 : milestoneIndex + 1;

      if (targetIndex < 0 || targetIndex >= newMilestones.length) {
        return prevProjects; // Cannot move further
      }

      // Swap elements
      [newMilestones[milestoneIndex], newMilestones[targetIndex]] = [newMilestones[targetIndex], newMilestones[milestoneIndex]];
      
      const updatedProject = { ...project, milestones: newMilestones };
      const updatedProjects = [
        ...prevProjects.slice(0, projectIndex),
        updatedProject,
        ...prevProjects.slice(projectIndex + 1),
      ];
      return updatedProjects;
    });
  };

  // Tasks CRUD
  const addTask = (
    projectId: string, 
    milestoneId: string, 
    task: Omit<Task, 'id' | 'milestoneId' | 'createdAt' | 'updatedAt'>
  ): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      milestoneId,
      createdAt: now,
      updatedAt: now
    };
    
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              milestones: project.milestones.map(milestone => 
                milestone.id === milestoneId
                  ? { 
                      ...milestone, 
                      tasks: [...milestone.tasks, newTask],
                      updatedAt: now 
                    }
                  : milestone
              ),
              updatedAt: now
            }
          : project
      )
    );
    
    return newTask;
  };

  const updateTask = (projectId: string, milestoneId: string, taskId: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              milestones: project.milestones.map(milestone => 
                milestone.id === milestoneId
                  ? { 
                      ...milestone, 
                      tasks: milestone.tasks.map(task =>
                        task.id === taskId
                          ? { ...task, ...updates, updatedAt: now }
                          : task
                      ),
                      updatedAt: now 
                    }
                  : milestone
              ),
              updatedAt: now
            }
          : project
      )
    );
  };

  const deleteTask = (projectId: string, milestoneId: string, taskId: string) => {
    const now = new Date().toISOString();
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              milestones: project.milestones.map(milestone => 
                milestone.id === milestoneId
                  ? { 
                      ...milestone, 
                      tasks: milestone.tasks.filter(task => task.id !== taskId),
                      updatedAt: now 
                    }
                  : milestone
              ),
              updatedAt: now
            }
          : project
      )
    );
  };

  // Tags CRUD
  const addTag = (tag: Omit<Tag, 'id'>): Tag => {
    const newTag: Tag = {
      ...tag,
      id: uuidv4()
    };
    
    setTags(prev => [...prev, newTag]);
    return newTag;
  };

  const updateTag = (id: string, updates: Partial<Tag>) => {
    setTags(prev => 
      prev.map(tag => 
        tag.id === id
          ? { ...tag, ...updates }
          : tag
      )
    );

    // Also update tags in projects
    setProjects(prev => 
      prev.map(project => {
        // Update project tags
        const updatedProjectTags = project.tags?.map(tag => 
          tag.id === id ? { ...tag, ...updates } : tag
        );
        
        // Update task tags in all milestones
        const updatedMilestones = project.milestones.map(milestone => {
          const updatedTasks = milestone.tasks.map(task => {
            const updatedTaskTags = task.tags?.map(tag => 
              tag.id === id ? { ...tag, ...updates } : tag
            );
            
            return { ...task, tags: updatedTaskTags };
          });
          
          return { ...milestone, tasks: updatedTasks };
        });
        
        return { 
          ...project, 
          tags: updatedProjectTags, 
          milestones: updatedMilestones 
        };
      })
    );
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(tag => tag.id !== id));
    
    // Also remove this tag from all projects
    setProjects(prev => 
      prev.map(project => {
        // Remove tag from project tags
        const updatedProjectTags = project.tags?.filter(tag => tag.id !== id);
        
        // Remove tag from all task tags in all milestones
        const updatedMilestones = project.milestones.map(milestone => {
          const updatedTasks = milestone.tasks.map(task => {
            const updatedTaskTags = task.tags?.filter(tag => tag.id !== id);
            
            return { ...task, tags: updatedTaskTags };
          });
          
          return { ...milestone, tasks: updatedTasks };
        });
        
        return { 
          ...project, 
          tags: updatedProjectTags, 
          milestones: updatedMilestones 
        };
      })
    );
  };

  // Settings
  const updateSettings = (updates: Partial<TimelineSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleProjectVisibility = (projectId: string) => {
    setSettings(prev => {
      const hiddenProjectIds = prev.hiddenProjectIds || [];
      if (hiddenProjectIds.includes(projectId)) {
        return { ...prev, hiddenProjectIds: hiddenProjectIds.filter(id => id !== projectId) };
      } else {
        return { ...prev, hiddenProjectIds: [...hiddenProjectIds, projectId] };
      }
    });
  };

  // Helper functions
  const getProjectById = (id: string): Project | undefined => {
    return projects.find(project => project.id === id);
  };

  const getMilestoneById = (id: string): Milestone | undefined => {
    for (const project of projects) {
      const milestone = project.milestones.find(ms => ms.id === id);
      if (milestone) return milestone;
    }
    return undefined;
  };

  const contextValue = useMemo(() => ({
    // Projects
    projects,
    addProject,
    updateProject,
    deleteProject,
    
    // Milestones
    addMilestone,
    updateMilestone,
    deleteMilestone,
    moveMilestone, // Added
    
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    
    // Tags
    tags,
    addTag,
    updateTag,
    deleteTag,
    
    // Settings
    settings,
    updateSettings,
    toggleProjectVisibility, // Add to context value
    
    // Helpers
    getProjectById,
    getMilestoneById,
    isLoading
  }), [projects, tags, settings, isLoading]);

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};
