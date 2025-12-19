import { useState, useEffect, useCallback, useRef } from 'react';
import { BotProject } from '@/types/bot';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(project: BotProject | null, interval = 30000) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProjectRef = useRef<string | null>(null);

  const save = useCallback(async () => {
    if (!project) return;

    const projectJson = JSON.stringify(project);
    if (projectJson === lastProjectRef.current) return;

    setStatus('saving');
    
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    lastProjectRef.current = projectJson;
    setStatus('saved');
    setLastSaved(new Date());

    setTimeout(() => setStatus('idle'), 2000);
  }, [project]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  useEffect(() => {
    if (!project) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(save, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project, interval, save]);

  return { status, lastSaved, forceSave };
}
