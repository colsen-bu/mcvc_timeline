'use client';

import { useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, Badge } from '../../components/ui/Elements';
import { TimelineView } from '../../components/timeline/TimelineView';
import { ProjectForm, MilestoneForm } from '../../components/timeline/ProjectForms';
import { Project, TimelineViewType, TimelineSettings } from '../../models/types';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function TimelinePage() {
  const { projects, isLoading, settings, toggleProjectVisibility } = useTimeline();
  const [activeView, setActiveView] = useState<TimelineViewType>('gantt');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showNewMilestoneForm, setShowNewMilestoneForm] = useState(false);
  const [showEditMilestoneForm, setShowEditMilestoneForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  
  // Form success handlers
  const handleFormSuccess = () => {
    setShowNewProjectForm(false);
    setShowNewMilestoneForm(false);
    setShowEditMilestoneForm(false);
    setSelectedProjectId(null);
    setSelectedMilestoneId(null);
  };
  
  if (showNewProjectForm) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
          <Card>
            <ProjectForm onSave={handleFormSuccess} onCancel={() => setShowNewProjectForm(false)} />
          </Card>
        </div>
      </PageLayout>
    );
  }
  
  if (showNewMilestoneForm && selectedProjectId) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Add Milestone</h1>
          <Card>
            <MilestoneForm 
              projectId={selectedProjectId} 
              onSave={handleFormSuccess} 
              onCancel={() => {
                setShowNewMilestoneForm(false);
                setSelectedProjectId(null);
              }} 
            />
          </Card>
        </div>
      </PageLayout>
    );
  }
  
  if (showEditMilestoneForm && selectedProjectId && selectedMilestoneId) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Edit Milestone</h1>
          <Card>
            <MilestoneForm 
              projectId={selectedProjectId}
              milestoneId={selectedMilestoneId}
              onSave={handleFormSuccess} 
              onCancel={() => {
                setShowEditMilestoneForm(false);
                setSelectedProjectId(null);
                setSelectedMilestoneId(null);
              }} 
            />
          </Card>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg ${
                  activeView === 'gantt' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveView('gantt')}
              >
                Gantt
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border border-gray-200 ${
                  activeView === 'calendar' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveView('calendar')}
              >
                Calendar
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg ${
                  activeView === 'list' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveView('list')}
              >
                List
              </button>
            </div>
          </div>
        </div>
        
        {/* Timeline View */}
        <TimelineView viewType={activeView} />
        
        {/* Projects List */}
        {!isLoading && projects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">Projects</h2>
            <div className="space-y-4">
              {projects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  settings={settings}
                  toggleProjectVisibility={toggleProjectVisibility}
                  onAddMilestone={(projectId) => {
                    setSelectedProjectId(projectId);
                    setShowNewMilestoneForm(true);
                  }}
                  onEditMilestone={(projectId, milestoneId) => {
                    setSelectedProjectId(projectId);
                    setSelectedMilestoneId(milestoneId);
                    setShowEditMilestoneForm(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

interface ProjectCardProps {
  project: Project;
  settings: TimelineSettings;
  toggleProjectVisibility: (projectId: string) => void;
  onAddMilestone: (projectId: string) => void;
  onEditMilestone: (projectId: string, milestoneId: string) => void;
}

const ProjectCard = ({ project, settings, toggleProjectVisibility, onAddMilestone, onEditMilestone }: ProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHidden = settings.hiddenProjectIds?.includes(project.id);

  return (
    <Card>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-3" 
              style={{ backgroundColor: project.color || '#60A5FA' }}
            />
            <h3 className="font-medium">{project.title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleProjectVisibility(project.id)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title={isHidden ? 'Show project' : 'Hide project'}
            >
              {isHidden ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
            <button 
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => onAddMilestone(project.id)}
            >
              Add Milestone
            </button>
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pl-6">
            {project.description && (
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
            )}
            
            <div className="space-y-3">
              {project.milestones.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No milestones yet</div>
              ) : (
                project.milestones.map(milestone => (
                <div key={milestone.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={milestone.completed}
                        readOnly
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                      />
                      <span className={milestone.completed ? 'line-through text-gray-400' : ''}>
                        {milestone.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge color={milestone.completed ? 'green' : 'blue'}>
                        {milestone.completed ? 'Completed' : 'In Progress'}
                      </Badge>
                      <button 
                        onClick={() => onEditMilestone(project.id, milestone.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit milestone"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.1l-2.12.404.404-2.12L19.1 4.393z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
