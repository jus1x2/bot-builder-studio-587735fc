import { useEffect, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Hook to synchronize profile and projects with the database
 * Call this hook in the App component to ensure projects are loaded from DB
 */
export function useProjectSync() {
  const { profile, isLoading: isTgLoading, isTelegramWebApp } = useTelegram();
  const { setProfileId, loadProjectsFromCloud, profileId, isSyncing } = useProjectStore();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Wait for Telegram auth to complete
    if (isTgLoading) return;

    // If we have a profile from Telegram auth
    if (profile?.id) {
      // Set profile ID in store
      if (profileId !== profile.id) {
        console.log('[ProjectSync] Setting profile ID:', profile.id);
        setProfileId(profile.id);
      }

      // Load projects from cloud (only once per session)
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        console.log('[ProjectSync] Loading projects from cloud for profile:', profile.id);
        loadProjectsFromCloud(profile.id);
      }
    } else if (!isTelegramWebApp) {
      // Not in Telegram context - use demo mode with localStorage only
      console.log('[ProjectSync] Not in Telegram WebApp, using local storage only');
    }
  }, [profile?.id, isTgLoading, isTelegramWebApp, profileId, setProfileId, loadProjectsFromCloud]);

  return {
    isLoading: isTgLoading || isSyncing,
    profileId: profile?.id || null,
    isTelegramWebApp,
  };
}
