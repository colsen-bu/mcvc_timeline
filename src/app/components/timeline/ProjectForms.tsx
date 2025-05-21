'use client';

import { useState, useEffect } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { Project, Milestone } from '../../models/types';
import { Button, Input, Textarea } from '../ui/Elements';
import { format } from 'date-fns';

interface ProjectFormProps {
  projectId?: string;
  onSave?: (project: Project) => void;
  onCancel?: () => void;
}

export const ProjectForm = ({ projectId, onSave, onCancel }: ProjectFormProps) => {
  const { addProject, updateProject, getProjectById } = useTimeline();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState('#60A5FA'); // Default blue color

  // If editing an existing project, load its data
  useEffect(() => {
    if (projectId) {
      const project = getProjectById(projectId);
      if (project) {
        setTitle(project.title);
        setDescription(project.description || '');
        setStartDate(project.startDate.split('T')[0]);
        setEndDate(project.endDate ? project.endDate.split('T')[0] : '');
        setColor(project.color || '#60A5FA');
      }
    }
  }, [projectId, getProjectById]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = 'End date cannot be before start date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const convertDateStringToLocalISO = (dateString: string) => {
        if (!dateString) return undefined;
        const parts = dateString.split('-').map(Number);
        // Month is 0-indexed in Date constructor (parts[1] - 1)
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
        return localDate.toISOString();
      };

      const formattedStartDate = convertDateStringToLocalISO(startDate)!; // startDate is required
      const formattedEndDate = endDate ? convertDateStringToLocalISO(endDate) : undefined;

      let savedProject: Project;

      if (projectId) {
        // Update existing project
        updateProject(projectId, {
          title,
          description: description || undefined,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          color
        });
        
        savedProject = getProjectById(projectId)!;
      } else {
        // Create new project
        savedProject = addProject({
          title,
          description: description || undefined,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          color
        });
      }

      if (onSave) {
        onSave(savedProject);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setFormErrors({ form: 'Failed to save project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="project-title"
        label="Project Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={formErrors.title}
        required
      />

      <Textarea
        id="project-description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter project description (optional)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="project-start-date"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={formErrors.startDate}
          required
        />

        <Input
          id="project-end-date"
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={formErrors.endDate}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Color
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-20"
        />
      </div>

      {formErrors.form && (
        <div className="text-sm text-red-600">{formErrors.form}</div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : projectId ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

interface MilestoneFormProps {
  projectId: string;
  milestoneId?: string;
  onSave?: (milestone: Milestone) => void;
  onCancel?: () => void;
}

export const MilestoneForm = ({ projectId, milestoneId, onSave, onCancel }: MilestoneFormProps) => {
  const { addMilestone, updateMilestone, getProjectById, deleteMilestone } = useTimeline();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [color, setColor] = useState('');
  const [completed, setCompleted] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'on_track' | 'at_risk' | 'completed'>('not_started');

  // If editing an existing milestone, load its data
  useEffect(() => {
    if (projectId && milestoneId) {
      const project = getProjectById(projectId);
      if (project) {
        const milestone = project.milestones.find(m => m.id === milestoneId);
        if (milestone) {
          setTitle(milestone.title);
          setDescription(milestone.description || '');
          setStartDate(milestone.startDate.split('T')[0]);
          setEndDate(milestone.endDate.split('T')[0]);
          setColor(milestone.color || '');
          setCompleted(milestone.completed);
          setStatus(milestone.status || 'not_started');
        }
      }
    }
  }, [projectId, milestoneId, getProjectById]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    } else if (new Date(endDate) < new Date(startDate)) {
      errors.endDate = 'End date cannot be before start date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();

      let savedMilestone: Milestone;

      if (milestoneId) {
        // Update existing milestone
        updateMilestone(projectId, milestoneId, {
          title,
          description: description || undefined,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          color: color || undefined,
          completed,
          status
        });
        
        const project = getProjectById(projectId);
        savedMilestone = project!.milestones.find(m => m.id === milestoneId)!;
      } else {
        // Create new milestone
        savedMilestone = addMilestone(projectId, {
          title,
          description: description || undefined,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          color: color || undefined,
          completed,
          status
        });
      }

      if (onSave) {
        onSave(savedMilestone);
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
      setFormErrors({ form: 'Failed to save milestone. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!milestoneId) return;

    // Basic confirmation, you might want a more sophisticated modal
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        deleteMilestone(projectId, milestoneId);
        if (onCancel) {
          onCancel(); // Close the form or navigate away
        }
      } catch (error) {
        console.error('Error deleting milestone:', error);
        setFormErrors({ form: 'Failed to delete milestone. Please try again.' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="milestone-title"
        label="Milestone Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={formErrors.title}
        required
      />

      <Textarea
        id="milestone-description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter milestone description (optional)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="milestone-start-date"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={formErrors.startDate}
          required
        />

        <Input
          id="milestone-end-date"
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={formErrors.endDate}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color (optional)
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20"
          />
        </div>

        <div className="flex items-center">
          <input
            id="milestone-completed"
            type="checkbox"
            checked={completed}
            onChange={(e) => {
              setCompleted(e.target.checked);
              if (e.target.checked) {
                setStatus('completed');
              } else if (status === 'completed') {
                setStatus('on_track');
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="milestone-completed" className="ml-2 text-sm text-gray-700">
            Mark as completed
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex items-center px-3 py-2 rounded border ${status === 'not_started' ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <input
              type="radio"
              name="milestone-status"
              value="not_started"
              checked={status === 'not_started'}
              onChange={() => setStatus('not_started')}
              className="h-4 w-4 text-gray-600 mr-2"
            />
            Not Started
          </label>
          
          <label className={`inline-flex items-center px-3 py-2 rounded border ${status === 'on_track' ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <input
              type="radio"
              name="milestone-status"
              value="on_track"
              checked={status === 'on_track'}
              onChange={() => setStatus('on_track')}
              className="h-4 w-4 text-indigo-600 mr-2"
            />
            On Track
          </label>
          
          <label className={`inline-flex items-center px-3 py-2 rounded border ${status === 'at_risk' ? 'bg-red-100 border-red-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <input
              type="radio"
              name="milestone-status"
              value="at_risk"
              checked={status === 'at_risk'}
              onChange={() => setStatus('at_risk')}
              className="h-4 w-4 text-red-600 mr-2"
            />
            At Risk
          </label>
          
          <label className={`inline-flex items-center px-3 py-2 rounded border ${status === 'completed' ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <input
              type="radio"
              name="milestone-status"
              value="completed"
              checked={status === 'completed'}
              onChange={() => {
                setStatus('completed');
                setCompleted(true);
              }}
              className="h-4 w-4 text-green-600 mr-2"
            />
            Completed
          </label>
        </div>
      </div>

      {formErrors.form && (
        <div className="text-sm text-red-600">{formErrors.form}</div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {milestoneId && (
          <Button variant="danger" onClick={handleDelete} type="button">
            Delete
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : milestoneId ? 'Update Milestone' : 'Create Milestone'}
        </Button>
      </div>
    </form>
  );
};
