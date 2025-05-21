'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTimeline } from '../../context/TimelineContext';
import { format, addDays, differenceInDays, isBefore, isAfter, parseISO, startOfDay, subDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfMonth, getWeek, endOfWeek, startOfQuarter, addQuarters, isSameDay, isSameWeek } from 'date-fns';
import { Card, EmptyState, Button } from '../ui/Elements';
import { Project, TimelineViewType, TimeScaleType } from '../../models/types';
import { MilestoneForm } from './ProjectForms';
import html2canvas from 'html2canvas-pro';
import { createExportableClone } from './ExportUtils';

interface TimelineViewProps {
  viewType?: TimelineViewType;
}

// Helper function to convert timeScale setting to days
const timeScaleToDays = (timeScale: string): number => {
  switch (timeScale) {
    case 'day': return 30;
    case 'week': return 90;
    case 'month': return 180;
    case 'year': return 365;
    default: return 90;
  }
};

// Calculate optimal unit width based on container width and time scale
const calculateOptimalUnitWidth = (containerWidth: number, unitCount: number, timeScaleMode: string): number => {
  if (unitCount <= 0 || containerWidth <= 0) {
    switch (timeScaleMode) {
      case 'day': return 30;
      case 'week': return 70;
      case 'month': return 100;
      case 'year': return 120;
      default: return 70;
    }
  }

  const minUnitWidths: { [key: string]: number } = {
    day: 25,
    week: 60,
    month: 80,
    year: 100,
  };
  const currentMinUnitWidth = minUnitWidths[timeScaleMode] || 30;

  let optimalWidth = containerWidth / unitCount;
  optimalWidth = Math.max(optimalWidth, currentMinUnitWidth);
  
  return optimalWidth;
};

export const TimelineView = ({ viewType = 'gantt' }: TimelineViewProps) => {
  const { projects, settings, isLoading, updateSettings, toggleProjectVisibility } = useTimeline();
  
  const [calculatedUnitWidth, setCalculatedUnitWidth] = useState<number>(30);
  const [editingMilestone, setEditingMilestone] = useState<{projectId: string, milestoneId: string} | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const today = startOfDay(new Date());

  const timeRange = useMemo(() => {
    const currentScaleDays = timeScaleToDays(settings.timeScale || 'week');
    
    let earliestStart = today;
    let latestEnd = addDays(today, currentScaleDays -1);

    const visibleProjects = projects.filter(p => !settings.hiddenProjectIds?.includes(p.id)); // Filter projects

    if (visibleProjects.length > 0) {
      const projectDates: Date[] = [];
      visibleProjects.forEach((project) => {
        projectDates.push(parseISO(project.startDate));
        if (project.endDate) {
          projectDates.push(parseISO(project.endDate));
        }
        project.milestones.forEach((milestone) => {
          projectDates.push(parseISO(milestone.startDate));
          if (milestone.endDate) {
            projectDates.push(parseISO(milestone.endDate));
          }
        });
      });

      if (projectDates.length > 0) {
        projectDates.sort((a, b) => a.getTime() - b.getTime());
        const overallEarliest = projectDates[0];
        const maxPastDays = Math.floor(currentScaleDays * 0.3);
        const earliestAllowedByToday = subDays(today, maxPastDays);
        
        earliestStart = isAfter(overallEarliest, earliestAllowedByToday) ? overallEarliest : earliestAllowedByToday;
      }
    }
    latestEnd = addDays(earliestStart, currentScaleDays - 1);
    
    return {
      startDate: startOfDay(earliestStart),
      endDate: startOfDay(latestEnd),
      days: currentScaleDays
    };
  }, [projects, settings.timeScale, today, settings.hiddenProjectIds]);

  const scale = useMemo(() => {
    const { startDate, endDate, days } = timeRange;
    const generatedScale: Date[] = [];
    const startOfFirstDay = startOfDay(startDate);
    
    switch(settings.timeScale) {
      case 'day':
        for (let i = 0; i < days; i++) {
          generatedScale.push(addDays(startOfFirstDay, i));
        }
        break;
      case 'week':
        let currentWeek = startOfWeek(startOfFirstDay, { weekStartsOn: 1 });
        const rangeEndWeek = endOfWeek(endDate, { weekStartsOn: 1 });
        while (isBefore(currentWeek, rangeEndWeek) || isSameDay(currentWeek, rangeEndWeek)) {
          generatedScale.push(currentWeek);
          currentWeek = addWeeks(currentWeek, 1);
          if (generatedScale.length > 200) break;
          if (isAfter(startOfWeek(currentWeek, { weekStartsOn: 1 }), rangeEndWeek)) break;
        }
        break;
      case 'month':
        let currentMonth = startOfMonth(startOfFirstDay);
        const rangeEndMonth = endOfMonth(endDate);
        while (isBefore(currentMonth, rangeEndMonth) || isSameDay(currentMonth, rangeEndMonth)) {
          generatedScale.push(currentMonth);
          currentMonth = addMonths(currentMonth, 1);
          if (generatedScale.length > 72) break;
          if (isAfter(startOfMonth(currentMonth), rangeEndMonth)) break;
        }
        break;
      case 'year':
        let currentQuarter = startOfQuarter(startOfFirstDay);
        for (let i = 0; i < 4; i++) {
          if (i > 0) currentQuarter = addQuarters(startOfQuarter(startOfFirstDay), i);
          if (isBefore(currentQuarter, addYears(endDate, 1)) && isAfter(currentQuarter, subYears(startDate,1))) {
             if (!generatedScale.find(d => isSameDay(d, currentQuarter))) {
                generatedScale.push(currentQuarter);
             }
          }
          if (generatedScale.length >=4 && isAfter(currentQuarter, endDate)) break;
        }
        if (generatedScale.length === 0) {
            generatedScale.push(startOfQuarter(startOfFirstDay));
        }
        if (generatedScale.length > 5) generatedScale.splice(5);
        break;
      default:
        let defCurrentWeek = startOfWeek(startOfFirstDay, { weekStartsOn: 1 });
        const defRangeEndWeek = endOfWeek(endDate, { weekStartsOn: 1 });
        while (isBefore(defCurrentWeek, defRangeEndWeek) || isSameDay(defCurrentWeek, defRangeEndWeek)) {
          generatedScale.push(defCurrentWeek);
          defCurrentWeek = addWeeks(defCurrentWeek, 1);
          if (generatedScale.length > 200) break; 
          if (isAfter(startOfWeek(defCurrentWeek, { weekStartsOn: 1 }), defRangeEndWeek)) break;
        }
    }
    return generatedScale;
  }, [timeRange, settings.timeScale]);

  useEffect(() => {
    const targetElement = containerRef.current;
    if (!targetElement || scale.length === 0) return;

    // Reset calculated unit width when time scale changes
    setCalculatedUnitWidth(calculateOptimalUnitWidth(
      targetElement.offsetWidth,
      scale.length,
      settings.timeScale || 'week'
    ));

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const currentContainerWidth = entry.contentRect.width;
        if (currentContainerWidth > 0 && scale.length > 0) {
          const optimalUnitW = calculateOptimalUnitWidth(
            currentContainerWidth,
            scale.length,
            settings.timeScale || 'week'
          );
          setCalculatedUnitWidth(optimalUnitW);
        }
      }
    });

    observer.observe(targetElement);
    
    const initialWidth = targetElement.offsetWidth;
    if (initialWidth > 0 && scale.length > 0) {
        const optimalUnitW = calculateOptimalUnitWidth(
            initialWidth,
            scale.length,
            settings.timeScale || 'week'
        );
        setCalculatedUnitWidth(optimalUnitW);
    }

    return () => {
      observer.unobserve(targetElement);
      observer.disconnect();
    };
  }, [scale, settings.timeScale]);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Loading...</div>;
  }

  const visibleProjects = projects.filter(p => !settings.hiddenProjectIds?.includes(p.id)); // Filter projects

  if (visibleProjects.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create your first project to start planning your timeline."
      />
    );
  }

  const exportToPNG = async () => {
    if (typeof window === 'undefined' || !timelineRef.current) {
      alert('Timeline element not found.');
      return;
    }

    try {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.style.position = 'fixed';
      loadingIndicator.style.top = '50%';
      loadingIndicator.style.left = '50%';
      loadingIndicator.style.transform = 'translate(-50%, -50%)';
      loadingIndicator.style.padding = '20px';
      loadingIndicator.style.background = 'rgba(0,0,0,0.7)';
      loadingIndicator.style.color = 'white';
      loadingIndicator.style.borderRadius = '8px';
      loadingIndicator.style.zIndex = '10000';
      loadingIndicator.textContent = 'Creating PNG image...';
      document.body.appendChild(loadingIndicator);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const exportContainer = createExportableClone(timelineRef.current);
      if (!exportContainer) {
        alert('Failed to create exportable view');
        document.body.removeChild(loadingIndicator);
        return;
      }
      
      document.body.appendChild(exportContainer);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      try {
        const canvas = await html2canvas(exportContainer.firstElementChild as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
          removeContainer: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = 'timeline.png';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        document.body.removeChild(exportContainer);
        document.body.removeChild(loadingIndicator);
        
      } catch (canvasError) {
        console.error('Error generating canvas:', canvasError);
        
        document.body.removeChild(exportContainer);
        document.body.removeChild(loadingIndicator);
        
        try {
          alert('Using alternative export method. If colors appear incorrect, please try again in a different browser.');
          const originalCanvas = await html2canvas(timelineRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false
          });
          
          const imgData = originalCanvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = imgData;
          downloadLink.download = 'timeline.png';
          
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
        } catch (finalError) {
          console.error('Final fallback failed:', finalError);
          alert('Export failed. Please try using the browser\'s screenshot functionality instead.');
        }
      }
      
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      alert('Failed to export timeline. Please try again or use a different browser.');
      
      const loadingIndicatorElement = document.querySelector('div[style*="Creating PNG image"]');
      if (loadingIndicatorElement?.parentNode) {
        loadingIndicatorElement.parentNode.removeChild(loadingIndicatorElement);
      }
      
      const exportContainerElement = document.querySelector('div[style*="-9999px"]');
      if (exportContainerElement?.parentNode) {
        exportContainerElement.parentNode.removeChild(exportContainerElement);
      }
    }
  };

  const TimelineControls = () => {
    const timeRangeOptions = [
      { label: '30 Days (Day)', value: 'day' as TimeScaleType },
      { label: '90 Days (Week)', value: 'week' as TimeScaleType },
      { label: '180 Days (Month)', value: 'month' as TimeScaleType },
      { label: '1 Year (Quarter)', value: 'year' as TimeScaleType },
    ];
    
    const handleTimeScaleChange = (newTimeScale: TimeScaleType) => {
      // Reset the calculated unit width when changing scale
      setCalculatedUnitWidth(30); // Reset to default first to avoid display issues during transition
      updateSettings({ timeScale: newTimeScale });
    };
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div className="flex-grow sm:flex-grow-0"></div>

        <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-sm text-gray-700 whitespace-nowrap">View:</span>
            <div className="inline-flex rounded-md shadow-sm w-full sm:w-auto">
              {timeRangeOptions.map((option, idx, arr) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeScaleChange(option.value)}
                  className={`px-3 py-1 text-sm font-medium border border-gray-200 flex-1 sm:flex-none
                    ${settings.timeScale === option.value 
                      ? 'bg-gray-100 text-gray-900 z-10' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${idx === 0 ? 'rounded-l-md' : ''}
                    ${idx === arr.length - 1 ? 'rounded-r-md' : ''}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Button 
            onClick={exportToPNG}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PNG
          </Button>
        </div>
      </div>
    );
  };

  if (editingMilestone) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Milestone</h1>
        <Card>
          <MilestoneForm 
            projectId={editingMilestone.projectId}
            milestoneId={editingMilestone.milestoneId}
            onSave={() => setEditingMilestone(null)} 
            onCancel={() => setEditingMilestone(null)}
          />
        </Card>
      </div>
    );
  }
  
  if (viewType === 'gantt') {
    return (
      <>
        <TimelineControls />
        <GanttView 
          projects={visibleProjects}
          timeRange={timeRange} 
          timeScaleData={scale} 
          unitWidth={calculatedUnitWidth}
          timelineRef={timelineRef}
          containerRef={containerRef}
          onEditMilestone={(projectId: string, milestoneId: string) => setEditingMilestone({ projectId, milestoneId })}
          hiddenProjectIds={settings.hiddenProjectIds || []}
          onToggleProjectVisibility={toggleProjectVisibility}
        />
      </>
    );
  } else if (viewType === 'calendar') {
    return <div>Calendar view coming soon</div>;
  } else {
    return <div>List view coming soon</div>;
  }
};

interface GanttViewProps {
  projects: Project[];
  timeRange: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
  timeScaleData: Date[];
  unitWidth: number;
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onEditMilestone?: (projectId: string, milestoneId: string) => void;
  hiddenProjectIds: string[];
  onToggleProjectVisibility: (projectId: string) => void;
}

interface TimeUnitDisplay {
  label: string;
  startUnitIndex: number;
  unitSpan: number;
  width: number;
}

const GanttView = ({ projects, timeRange, timeScaleData, unitWidth, timelineRef, containerRef: parentContainerRef, onEditMilestone, hiddenProjectIds, onToggleProjectVisibility }: GanttViewProps) => {
  const { settings } = useTimeline();
  const timeScaleMode = settings.timeScale || 'week';
  const today = startOfDay(new Date());

  const dayEquivalentWidthPx = useMemo(() => {
    if (unitWidth === 0) return 1;
    switch (timeScaleMode) {
      case 'day': return unitWidth;
      case 'week': return unitWidth / 7;
      case 'month': 
        return unitWidth / 30.4375;
      case 'year':
        return unitWidth / 91.3125;
      default: return unitWidth / 7;
    }
  }, [unitWidth, timeScaleMode]);
  
  const totalTimelineWidth = useMemo(() => {
    return unitWidth * timeScaleData.length;
  }, [unitWidth, timeScaleData]);

  const getPositionForDate = (date: Date): number => {
    const dateToCompare = startOfDay(date);
    if (isBefore(dateToCompare, timeRange.startDate)) return 0;
    const daysDiff = Math.max(0, differenceInDays(dateToCompare, timeRange.startDate));
    return daysDiff * dayEquivalentWidthPx;
  };

  const getWidthBetweenDates = (itemStartDateStr: string, itemEndDateStr: string | undefined): number => {
    const itemStart = startOfDay(parseISO(itemStartDateStr));
    const itemEnd = itemEndDateStr ? startOfDay(parseISO(itemEndDateStr)) : itemStart;

    const effectiveStartDate = isBefore(itemStart, timeRange.startDate) ? timeRange.startDate : itemStart;
    const effectiveEndDate = itemEnd;

    if (isBefore(effectiveEndDate, effectiveStartDate)) return dayEquivalentWidthPx / 2;

    const daysDiff = differenceInDays(effectiveEndDate, effectiveStartDate);
    
    return (daysDiff) * dayEquivalentWidthPx;
  };
  
  const formatDateLabel = (date: Date, scaleMode: TimeScaleType) => {
    switch(scaleMode) {
      case 'day': return format(date, 'dd'); 
      case 'week': return `W${getWeek(date, { weekStartsOn: 1 })}`;
      case 'month': return format(date, 'MMM');
      case 'year': return `Q${Math.floor(date.getMonth() / 3) + 1}`;
      case 'quarter': return `Q${Math.floor(date.getMonth() / 3) + 1}`;
      default: return format(date, 'dd');
    }
  };
  
  const displayHeaders = useMemo(() => {
    const headers: TimeUnitDisplay[] = [];
    if (timeScaleData.length === 0) return headers;

    if (timeScaleMode === 'day') {
      let currentMonthLabel = format(timeScaleData[0], 'MMM yyyy');
      let monthStartIndex = 0;
      for (let i = 0; i < timeScaleData.length; i++) {
        const dayDate = timeScaleData[i];
        const monthOfThisDay = format(dayDate, 'MMM yyyy');
        if (monthOfThisDay !== currentMonthLabel || i === timeScaleData.length - 1) {
          const unitSpan = (i === timeScaleData.length - 1 && monthOfThisDay === currentMonthLabel) ? (i - monthStartIndex + 1) : (i - monthStartIndex);
          if (unitSpan > 0) {
            headers.push({
              label: currentMonthLabel,
              startUnitIndex: monthStartIndex,
              unitSpan: unitSpan,
              width: unitSpan * unitWidth,
            });
          }
          currentMonthLabel = monthOfThisDay;
          monthStartIndex = i;
        }
      }
      if (monthStartIndex < timeScaleData.length) {
        const unitSpan = timeScaleData.length - monthStartIndex;
        if (unitSpan > 0 && (headers.length === 0 || headers[headers.length-1].label !== currentMonthLabel)) {
          headers.push({
            label: currentMonthLabel,
            startUnitIndex: monthStartIndex,
            unitSpan: unitSpan,
            width: unitSpan * unitWidth,
          });
        }
      }
    } else if (timeScaleMode === 'week') {
      let currentMonthLabel = format(timeScaleData[0], 'MMM yyyy');
      let monthStartIndex = 0;
      for (let i = 0; i < timeScaleData.length; i++) {
        const weekDate = timeScaleData[i];
        const monthOfThisWeek = format(startOfMonth(weekDate), 'MMM yyyy');
        if (monthOfThisWeek !== currentMonthLabel || i === timeScaleData.length - 1) {
          const unitSpan = (i === timeScaleData.length - 1 && monthOfThisWeek === currentMonthLabel) ? (i - monthStartIndex + 1) : (i - monthStartIndex);
          if (unitSpan > 0) {
            headers.push({
              label: currentMonthLabel,
              startUnitIndex: monthStartIndex,
              unitSpan: unitSpan,
              width: unitSpan * unitWidth,
            });
          }
          currentMonthLabel = monthOfThisWeek;
          monthStartIndex = i;
        }
      }
      if (monthStartIndex < timeScaleData.length) {
        const unitSpan = timeScaleData.length - monthStartIndex;
        if (unitSpan > 0 && (headers.length === 0 || headers[headers.length-1].label !== currentMonthLabel)) {
          headers.push({
            label: currentMonthLabel,
            startUnitIndex: monthStartIndex,
            unitSpan: unitSpan,
            width: unitSpan * unitWidth,
          });
        }
      }
    } else if (timeScaleMode === 'month') {
      let currentYearLabel = format(timeScaleData[0], 'yyyy');
      let yearStartIndex = 0;
      for (let i = 0; i < timeScaleData.length; i++) {
        const monthDate = timeScaleData[i];
        const yearOfThisMonth = format(monthDate, 'yyyy');
        if (yearOfThisMonth !== currentYearLabel || i === timeScaleData.length - 1) {
          const unitSpan = (i === timeScaleData.length - 1 && yearOfThisMonth === currentYearLabel) ? (i - yearStartIndex + 1) : (i - yearStartIndex);
          if (unitSpan > 0) {
            headers.push({
              label: currentYearLabel,
              startUnitIndex: yearStartIndex,
              unitSpan: unitSpan,
              width: unitSpan * unitWidth,
            });
          }
          currentYearLabel = yearOfThisMonth;
          yearStartIndex = i;
        }
      }
      if (yearStartIndex < timeScaleData.length) {
        const unitSpan = timeScaleData.length - yearStartIndex;
        if (unitSpan > 0 && (headers.length === 0 || headers[headers.length-1].label !== currentYearLabel)) {
          headers.push({
            label: currentYearLabel,
            startUnitIndex: yearStartIndex,
            unitSpan: unitSpan,
            width: unitSpan * unitWidth,
          });
        }
      }
    } else if (timeScaleMode === 'year') {
      let currentYearLabel = format(timeScaleData[0], 'yyyy');
      let yearStartIndex = 0;
      for (let i = 0; i < timeScaleData.length; i++) {
        const quarterDate = timeScaleData[i];
        const yearOfThisQuarter = format(quarterDate, 'yyyy');
        if (yearOfThisQuarter !== currentYearLabel || i === timeScaleData.length - 1) {
          const unitSpan = (i === timeScaleData.length - 1 && yearOfThisQuarter === currentYearLabel) ? (i - yearStartIndex + 1) : (i - yearStartIndex);
          if (unitSpan > 0) {
            headers.push({
              label: currentYearLabel,
              startUnitIndex: yearStartIndex,
              unitSpan: unitSpan,
              width: unitSpan * unitWidth,
            });
          }
          currentYearLabel = yearOfThisQuarter;
          yearStartIndex = i;
        }
      }
      if (yearStartIndex < timeScaleData.length) {
        const unitSpan = timeScaleData.length - yearStartIndex;
        if (unitSpan > 0 && (headers.length === 0 || headers[headers.length-1].label !== currentYearLabel)) {
          headers.push({
            label: currentYearLabel,
            startUnitIndex: yearStartIndex,
            unitSpan: unitSpan,
            width: unitSpan * unitWidth,
          });
        }
      }
    }
    return headers;
  }, [timeScaleData, unitWidth, timeScaleMode]);

  const isTodayUnit = (date: Date): boolean => {
    if (!date) return false;
    switch (timeScaleMode) {
        case 'day': return isSameDay(date, today);
        case 'week': return isSameWeek(date, today, { weekStartsOn: 1 });
        case 'month': return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        case 'year':
            return isSameQuarter(date, today);
        default: return false;
    }
  };
  
  const isSameQuarter = (date1: Date, date2: Date): boolean => {
    return startOfQuarter(date1).getTime() === startOfQuarter(date2).getTime();
  };

  return (
    <Card className="overflow-hidden">
      <div className="mb-4 px-4 pt-4">
        <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
      </div>

      <div 
        className="overflow-x-auto" 
        ref={parentContainerRef}
        style={{ paddingBottom: '12px' }}
      >
        <div 
          ref={timelineRef}
          style={{ 
            width: `${totalTimelineWidth}px`, 
            minWidth: `${totalTimelineWidth}px`
          }}
          className="sticky top-0 z-30"
        >
          <div className="flex border-b border-gray-200 bg-gray-50">
            {displayHeaders.map((header, index) => (
              <div
                key={`header-${index}`}
                className="text-xs text-center font-semibold py-2 text-gray-700 border-r border-gray-200"
                style={{ width: `${header.width}px` }}
              >
                {header.label}
              </div>
            ))}
          </div>
          
          <div className="flex h-8 border-b border-gray-100 bg-white sticky top-[33px] z-30">
            {timeScaleData.map((date, index) => {
              const isWeekendDay = timeScaleMode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
              const todayHighlight = isTodayUnit(date);
              
              return (
                <div
                  key={`timescale-unit-${index}`}
                  className={`text-xs text-center text-gray-600 border-r border-gray-100 flex-shrink-0 flex items-center justify-center
                    ${isWeekendDay ? 'bg-gray-50' : ''} 
                    ${todayHighlight ? 'font-bold !text-red-600 bg-red-50' : ''}`}
                  style={{ width: `${unitWidth}px` }}
                >
                  {formatDateLabel(date, timeScaleMode)}
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-0">
              <div className="flex h-full">
                {timeScaleData.map((_, index) => (
                  <div
                    key={`grid-col-${index}`}
                    className="border-r border-gray-100 h-full"
                    style={{ width: `${unitWidth}px` }}
                  />
                ))}
              </div>
            </div>

            {(isAfter(today, timeRange.startDate) || isSameDay(today, timeRange.startDate)) && isBefore(today, addDays(timeRange.endDate,1)) && (
              <div
                className="absolute top-0 bottom-0 w-[1px] text-red-500 opacity-50 z-1"
                style={{
                  left: `${getPositionForDate(today) + (dayEquivalentWidthPx / 2) - 0.5}px`,
                  height: '100%',
                  backgroundImage: 'repeating-linear-gradient(to bottom, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)'
                }}
                title={`Today: ${format(today, 'MMM dd, yyyy')}`}
              />
            )}

            <div className="divide-y divide-gray-100 relative z-10">
              {projects.map((project) => (
                <div key={project.id} className="py-3 pl-2 pr-2 relative">
                  {/* Project bar with title */}
                  <div className="relative h-8 mb-2 flex items-center">
                    <button 
                      onClick={() => onToggleProjectVisibility(project.id)}
                      className="mr-2 p-1 focus:outline-none"
                      title={hiddenProjectIds.includes(project.id) ? 'Show project' : 'Hide project'}
                    >
                      {hiddenProjectIds.includes(project.id) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <div 
                      className={`absolute h-8 rounded-sm ${hiddenProjectIds.includes(project.id) ? 'opacity-30' : ''}`}
                      style={{
                        left: `${getPositionForDate(parseISO(project.startDate)) + 28}px`,
                        width: `${getWidthBetweenDates(project.startDate, project.endDate)}px`,
                        backgroundColor: project.color || '#60A5FA',
                      }}
                      title={project.title || 'Untitled Project'}
                    >
                      <div className="px-3 py-1 font-bold text-sm text-white truncate h-full flex items-center justify-center w-full">
                        {getWidthBetweenDates(project.startDate, project.endDate) > 200 ? 
                          (project.title || 'Untitled Project') : 
                          ''}
                      </div>
                    </div>
                    
                    {/* Project tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="absolute right-2 top-[-20px] flex space-x-1">
                        {project.tags.map((tag) => (
                          <span 
                            key={tag.id} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: tag.color, color: '#ffffff' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Milestones */}
                  {!hiddenProjectIds.includes(project.id) && (
                    <div className="mt-1 pl-4 relative">
                      {project.milestones.map((milestone) => {
                        const milestoneStartDate = parseISO(milestone.startDate);
                        const milestoneEndDate = parseISO(milestone.endDate);
                        const adjustedStartDate = addDays(milestoneStartDate, 1);
                        const milestonePosition = getPositionForDate(adjustedStartDate);
                        const milestoneWidth = getWidthBetweenDates(milestone.startDate, milestone.endDate);
                        
                        let statusColor = '#9CA3AF';
                        
                        if (milestone.status === 'completed' || (!milestone.status && milestone.completed)) {
                          statusColor = '#10B981';
                        }
                        else if (milestone.status === 'at_risk') {
                          statusColor = '#EF4444';
                        }
                        else if (milestone.status === 'on_track') {
                          statusColor = '#6366F1';
                        }
                        
                        return (
                          <div
                            key={milestone.id}
                            className="group relative mb-2 h-6"
                          >
                            <div 
                              className={`absolute h-6 rounded-sm flex items-center text-xs text-white ${milestone.status === 'completed' || milestone.completed ? 'opacity-70' : ''}`}
                              style={{
                                left: `${milestonePosition}px`,
                                width: `${milestoneWidth}px`,
                                backgroundColor: milestone.color || statusColor || project.color || '#60A5FA'
                              }}
                              onClick={() => onEditMilestone && onEditMilestone(project.id, milestone.id)}
                              title={`${milestone.title} - ${format(milestoneStartDate, 'MMM dd')}${milestone.endDate ? ' to ' + format(milestoneEndDate, 'MMM dd') : ''} (${milestone.status || 'not started'})`}
                            >
                              <span className="px-3 truncate z-10 flex-grow text-center">
                                {milestoneWidth > 60 ? (
                                  <>
                                    {(milestone.status === 'completed' || milestone.completed) && (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {milestone.title}
                                  </>
                                ) : milestoneWidth > 50 && (milestone.status === 'completed' || milestone.completed) ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : ''}
                              </span>
                              
                              {onEditMilestone && (
                                <div className="absolute right-0 top-0 bottom-0 bg-gray-700 bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center px-1 rounded-r-sm transition-opacity z-20">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditMilestone(project.id, milestone.id);
                                    }}
                                    className="text-white hover:text-blue-200"
                                    title="Edit milestone"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.1l-2.12.404.404-2.12L19.1 4.393z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const addYears = (date: Date, years: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
};
const subYears = (date: Date, years: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() - years);
  return newDate;
};
