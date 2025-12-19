import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { BotProject } from '@/types/bot';

interface HistoryState {
  past: string[];
  future: string[];
  currentSnapshot: string | null;
  
  pushState: (state: BotProject) => void;
  undo: () => BotProject | null;
  redo: () => BotProject | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  currentSnapshot: null,

  pushState: (project: BotProject) => {
    const snapshot = JSON.stringify(project);
    const { currentSnapshot, past } = get();
    
    // Don't push if state hasn't changed
    if (snapshot === currentSnapshot) return;
    
    set({
      past: currentSnapshot 
        ? [...past.slice(-MAX_HISTORY + 1), currentSnapshot]
        : past,
      future: [],
      currentSnapshot: snapshot,
    });
  },

  undo: () => {
    const { past, currentSnapshot, future } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      future: currentSnapshot ? [currentSnapshot, ...future] : future,
      currentSnapshot: previous,
    });

    return JSON.parse(previous) as BotProject;
  },

  redo: () => {
    const { past, currentSnapshot, future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: currentSnapshot ? [...past, currentSnapshot] : past,
      future: newFuture,
      currentSnapshot: next,
    });

    return JSON.parse(next) as BotProject;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  
  clear: () => set({ past: [], future: [], currentSnapshot: null }),
}));

export function useUndoRedo(
  project: BotProject | null,
  onRestore: (project: BotProject) => void
) {
  const { pushState, undo, redo, canUndo, canRedo } = useHistoryStore();
  const isRestoringRef = useRef(false);
  const lastProjectRef = useRef<string | null>(null);

  // Track project changes
  useEffect(() => {
    if (!project || isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    const projectString = JSON.stringify(project);
    if (projectString !== lastProjectRef.current) {
      lastProjectRef.current = projectString;
      pushState(project);
    }
  }, [project, pushState]);

  const handleUndo = useCallback(() => {
    const restored = undo();
    if (restored) {
      isRestoringRef.current = true;
      lastProjectRef.current = JSON.stringify(restored);
      onRestore(restored);
    }
  }, [undo, onRestore]);

  const handleRedo = useCallback(() => {
    const restored = redo();
    if (restored) {
      isRestoringRef.current = true;
      lastProjectRef.current = JSON.stringify(restored);
      onRestore(restored);
    }
  }, [redo, onRestore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}
