import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved';

export function useAutoSave(
  data: unknown,
  intervalMs: number = 30000
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const previousDataRef = useRef<string | null>(null);

  const performSave = useCallback(() => {
    const currentData = JSON.stringify(data);
    
    // Only save if data has changed
    if (previousDataRef.current === currentData) {
      return;
    }
    
    previousDataRef.current = currentData;
    setStatus('saving');
    
    // Simulate save (zustand persist handles actual storage)
    setTimeout(() => {
      setStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after showing "saved" state
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }, 500);
  }, [data]);

  useEffect(() => {
    // Initial data capture
    if (previousDataRef.current === null && data) {
      previousDataRef.current = JSON.stringify(data);
    }
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      performSave();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [performSave, intervalMs]);

  // Save on unmount if there are changes
  useEffect(() => {
    return () => {
      const currentData = JSON.stringify(data);
      if (previousDataRef.current !== currentData) {
        previousDataRef.current = currentData;
      }
    };
  }, [data]);

  return { status, lastSaved, forceSave: performSave };
}
