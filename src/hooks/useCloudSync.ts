import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useCloudSync(profileId?: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const saveToCloud = useCallback(async () => {
    if (!profileId) {
      toast({
        title: 'Авторизуйтесь',
        description: 'Для сохранения в облако нужна авторизация',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    
    try {
      // Simulate cloud save
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast({
        title: 'Сохранено в облако',
        description: 'Проект синхронизирован',
      });
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить в облако',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [profileId, toast]);

  return { isSyncing, saveToCloud };
}
