import { useState, useCallback, useEffect, useRef } from 'react';
import { BotProject } from '@/types/bot';

interface HistoryState {
  past: BotProject[];
  future: BotProject[];
}

export function useUndoRedo(
  project: BotProject | null,
  restoreProject: (project: BotProject) => void
) {
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const lastProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!project) return;

    const projectJson = JSON.stringify(project);
    if (lastProjectRef.current === projectJson) return;

    if (lastProjectRef.current !== null) {
      const previousProject = JSON.parse(lastProjectRef.current) as BotProject;
      setHistory((h) => ({
        past: [...h.past.slice(-49), previousProject],
        future: [],
      }));
    }

    lastProjectRef.current = projectJson;
  }, [project]);

  const undo = useCallback(() => {
    if (history.past.length === 0 || !project) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    setHistory({
      past: newPast,
      future: [project, ...history.future],
    });

    lastProjectRef.current = JSON.stringify(previous);
    restoreProject(previous);
  }, [history, project, restoreProject]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    if (project) {
      setHistory({
        past: [...history.past, project],
        future: newFuture,
      });
    }

    lastProjectRef.current = JSON.stringify(next);
    restoreProject(next);
  }, [history, project, restoreProject]);

  return {
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
