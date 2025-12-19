import { useEffect, useRef, useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { BotProject } from '@/types/bot';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(
  project: BotProject | null,
  intervalMs: number = 30000
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const previousDataRef = useRef<string | null>(null);
  const { syncProjectToCloud, profileId } = useProjectStore();

  const performSave = useCallback(async () => {
    if (!project) return;
    
    const currentData = JSON.stringify(project);
    
    // Only save if data has changed
    if (previousDataRef.current === currentData) {
      return;
    }
    
    previousDataRef.current = currentData;
    setStatus('saving');
    
    // If we have a profileId, sync to cloud
    if (profileId) {
      try {
        const success = await syncProjectToCloud(project.id);
        if (success) {
          setStatus('saved');
          setLastSaved(new Date());
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        setStatus('error');
      }
    } else {
      // No profileId - local storage only (zustand persist handles this)
      setStatus('saved');
      setLastSaved(new Date());
    }
    
    // Reset to idle after showing status
    setTimeout(() => {
      setStatus('idle');
    }, 2000);
  }, [project, profileId, syncProjectToCloud]);

  useEffect(() => {
    // Initial data capture
    if (previousDataRef.current === null && project) {
      previousDataRef.current = JSON.stringify(project);
    }
  }, [project]);

  useEffect(() => {
    const interval = setInterval(() => {
      performSave();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [performSave, intervalMs]);

  // Save on unmount if there are changes
  useEffect(() => {
    return () => {
      if (project) {
        const currentData = JSON.stringify(project);
        if (previousDataRef.current !== currentData && profileId) {
          // Fire and forget on unmount
          syncProjectToCloud(project.id).catch(console.error);
        }
      }
    };
  }, [project, profileId, syncProjectToCloud]);

  return { status, lastSaved, forceSave: performSave };
}
