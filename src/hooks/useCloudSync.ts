import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/stores/projectStore';
import { saveProjectToDatabase, loadProjectFromDatabase } from '@/lib/bot-database-service';

export function useCloudSync(userId?: string) {
  const { toast } = useToast();
  const { getCurrentProject, updateProject } = useProjectStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const saveToCloud = useCallback(async () => {
    const project = getCurrentProject();
    if (!project) {
      toast({
        title: 'Ошибка',
        description: 'Проект не найден',
        variant: 'destructive',
      });
      return false;
    }

    setIsSyncing(true);
    try {
      const success = await saveProjectToDatabase(project, userId);
      if (success) {
        toast({
          title: 'Сохранено в Cloud',
          description: 'Проект успешно сохранён в базу данных',
        });
        return true;
      } else {
        toast({
          title: 'Ошибка сохранения',
          description: 'Не удалось сохранить проект в Cloud',
          variant: 'destructive',
        });
        return false;
      }
    } finally {
      setIsSyncing(false);
    }
  }, [getCurrentProject, toast, userId]);

  const loadFromCloud = useCallback(async (projectId: string) => {
    setIsSyncing(true);
    try {
      const project = await loadProjectFromDatabase(projectId);
      if (project) {
        toast({
          title: 'Загружено из Cloud',
          description: 'Проект успешно загружен',
        });
        return project;
      } else {
        toast({
          title: 'Проект не найден',
          description: 'Проект не найден в Cloud',
          variant: 'destructive',
        });
        return null;
      }
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  return {
    isSyncing,
    saveToCloud,
    loadFromCloud,
  };
}
