'use client';

import { useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, EmptyState, Button } from '../../components/ui/Elements';
import { TimelineView } from '../../components/timeline/TimelineView';
import { ProjectForm } from '../../components/timeline/ProjectForms';
import { format } from 'date-fns';

export default function Dashboard() {
  const { projects, isLoading } = useTimeline();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  
  const handleProjectCreated = () => {
    setShowNewProjectForm(false);
  };
  
  if (showNewProjectForm) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
          <Card>
            <ProjectForm onSave={handleProjectCreated} onCancel={() => setShowNewProjectForm(false)} />
          </Card>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
        
        {/* Project Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="flex flex-col">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Projects</h3>
            <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
          </Card>
          
          <Card className="flex flex-col">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Milestones</h3>
            <p className="text-3xl font-bold text-gray-900">
              {projects.reduce(
                (count, project) => 
                  count + project.milestones.filter(m => !m.completed).length, 
                0
              )}
            </p>
          </Card>
          
          <Card className="flex flex-col">
            <h3 className="text-gray-600 text-sm font-medium mb-1">Completed Milestones</h3>
            <p className="text-3xl font-bold text-gray-900">
              {projects.reduce(
                (count, project) => 
                  count + project.milestones.filter(m => m.completed).length, 
                0
              )}
            </p>
          </Card>
        </div>
        
        {/* Timeline Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3 text-gray-900">Timeline Overview</h2>
          <TimelineView viewType="gantt" />
        </div>
        
        {/* Recent Projects */}
        <div>
          <h2 className="text-lg font-medium mb-3 text-gray-900">Recent Projects</h2>
          
          {isLoading ? (
            <div className="h-52 flex items-center justify-center">Loading...</div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first project to start planning your timeline."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...projects]
                .sort((a, b) => 
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )
                .slice(0, 3)
                .map(project => (
                  <Card key={project.id} className="flex flex-col">
                    <div 
                      className="h-1 rounded-t-md mb-4" 
                      style={{ backgroundColor: project.color || '#60A5FA' }}
                    />
                    <h3 className="font-medium text-lg mb-2 text-gray-900">{project.title}</h3>
                    {project.description && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-auto">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>
                          {project.milestones.length} milestone{project.milestones.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
