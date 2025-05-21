'use client';

import { useState } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card, Button, Input } from '../../components/ui/Elements';
import { TimelineViewType } from '../../models/types';
import { clearAllData } from '../../utils/localStorage';

export default function SettingsPage() {
  const { settings, updateSettings } = useTimeline();
  const [timeScale, setTimeScale] = useState<string>(settings.timeScale || 'week');
  const [viewType, setViewType] = useState<TimelineViewType>(settings.viewType || 'gantt');
  const [showCompleted, setShowCompleted] = useState<boolean>(settings.showCompletedItems || true);
  const [themeColor, setThemeColor] = useState<string>('#60A5FA');
  
  const handleSaveSettings = () => {
    updateSettings({
      timeScale: timeScale as 'day' | 'week' | 'month' | 'year',
      viewType,
      showCompletedItems: showCompleted,
      groupBy: 'none'
    });
    
    alert('Settings saved successfully!');
  };
  
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };
  
  return (
    <PageLayout>
      <div className="mb-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <Card className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Timeline Settings</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default View</label>
              <div className="flex flex-wrap gap-3">
                <div className="flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg ${
                      viewType === 'gantt' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setViewType('gantt')}
                  >
                    Gantt
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium border border-gray-200 ${
                      viewType === 'calendar' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setViewType('calendar')}
                  >
                    Calendar
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg ${
                      viewType === 'list' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setViewType('list')}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Scale</label>
              <select
                value={timeScale}
                onChange={(e) => setTimeScale(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                id="show-completed"
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show-completed" className="ml-2 text-sm text-gray-800">
                Show completed items in timeline
              </label>
            </div>
          </div>
          
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </Card>
        
        <Card className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Theme & Appearance</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-10 w-20"
              />
              <span className="ml-3 text-sm text-gray-600">Coming soon in a future update</span>
            </div>
          </div>
        </Card>
        
        <Card className="bg-red-50">
          <h2 className="text-lg font-medium text-red-800 mb-4">Danger Zone</h2>
          <p className="text-sm text-gray-700 mb-4">
            The following actions are destructive and cannot be undone. Please use with caution.
          </p>
          <Button variant="danger" onClick={handleClearData}>
            Clear All Data
          </Button>
        </Card>
      </div>
    </PageLayout>
  );
}
