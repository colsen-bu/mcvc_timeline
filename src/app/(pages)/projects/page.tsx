'use client';

import { useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, EmptyState, Button, Badge } from '../../components/ui/Elements';
import { ProjectForm } from '../../components/timeline/ProjectForms';
import { format } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'; // Added icons

export default function ProjectsPage() {
  const { projects, isLoading, deleteProject, settings, toggleProjectVisibility, moveMilestone } = useTimeline(); // Added moveMilestone
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  const handleProjectSaved = () => {
    setShowNewProjectForm(false);
    setEditingProjectId(null);
  };

  const handleEditProject = (projectId: string) => {
    setEditingProjectId(projectId);
  };
  
  if (showNewProjectForm || editingProjectId) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {editingProjectId ? 'Edit Project' : 'Create New Project'}
          </h1>
          <Card>
            <ProjectForm 
              projectId={editingProjectId || undefined}
              onSave={handleProjectSaved} 
              onCancel={() => {
                setShowNewProjectForm(false);
                setEditingProjectId(null);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <Button 
            variant="primary"
            onClick={() => setShowNewProjectForm(true)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          >
            New Project
          </Button>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">Loading...</div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No Projects"
            description="You haven't created any projects yet."
          />
        ) : (
          <div className="space-y-6">
            {projects.map(project => (
              <Card key={project.id} className="overflow-hidden">
                <div className="border-l-4 -ml-6 pl-5" style={{ borderColor: project.color || '#60A5FA' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{project.title}</h3>
                      {project.description && (
                        <p className="text-gray-700">{project.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProjectVisibility(project.id)}
                      >
                        {settings.hiddenProjectIds?.includes(project.id) ? (
                          <span title="Show in timeline">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.175 2.175M16.125 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029" />
                            </svg>
                          </span>
                        ) : (
                          <span title="Hide in timeline">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </span>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProject(project.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                            deleteProject(project.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-700 mb-4">
                    <div className="mr-6 mb-2">
                      <span className="font-medium">Start:</span> {format(new Date(project.startDate), 'MMM d, yyyy')}
                    </div>
                    {project.endDate && (
                      <div className="mr-6 mb-2">
                        <span className="font-medium">End:</span> {format(new Date(project.endDate), 'MMM d, yyyy')}
                      </div>
                    )}
                    <div className="mb-2">
                      <span className="font-medium">Milestones:</span> {project.milestones.length}
                    </div>
                  </div>
                  
                  {project.milestones.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Milestones</h4>
                      <ul className="space-y-2">
                        {project.milestones.map(milestone => {
                          let statusLabel = "Not Started";
                          let statusColor: "green" | "red" | "indigo" | "gray" = "gray";

                          if (milestone.status === 'completed' || (!milestone.status && milestone.completed)) {
                            statusLabel = 'Completed';
                            statusColor = 'green';
                          } else if (milestone.status === 'at_risk') {
                            statusLabel = 'At Risk';
                            statusColor = 'red';
                          } else if (milestone.status === 'on_track') {
                            statusLabel = 'On Track';
                            statusColor = 'indigo';
                          }
                          // 'not_started' or undefined status without milestone.completed true defaults to "Not Started" and "gray"

                          return (
                            <li key={milestone.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                                  style={{ backgroundColor: milestone.color || project.color || '#60A5FA' }}
                                />
                                <span className="text-gray-800 dark:text-gray-700">{milestone.title}</span>
                              </div>
                              <div className="flex items-center">
                                <Badge color={statusColor} className="mr-3">
                                  {statusLabel}
                                </Badge>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveMilestone(project.id, milestone.id, 'up')}
                                  disabled={project.milestones.findIndex(m => m.id === milestone.id) === 0}
                                  className="mr-1 p-1 h-auto"
                                >
                                  <ArrowUpIcon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveMilestone(project.id, milestone.id, 'down')}
                                  disabled={project.milestones.findIndex(m => m.id === milestone.id) === project.milestones.length - 1}
                                  className="p-1 h-auto"
                                >
                                  <ArrowDownIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
