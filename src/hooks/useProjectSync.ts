import { useEffect, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useProjectStore } from '@/stores/projectStore';
import { supabase } from '@/integrations/supabase/client';

// Auto-generated profile ID for web mode (not "demo" - just persistent web user)
const WEB_PROFILE_ID = '179254b7-9d65-46c0-913f-ddeb74a26183';

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

    const initProfile = async () => {
      let effectiveProfileId = profile?.id;

      // If not in Telegram context, use web profile for persistence
      if (!effectiveProfileId && !isTelegramWebApp) {
        effectiveProfileId = WEB_PROFILE_ID;
        
        // Ensure web profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', WEB_PROFILE_ID)
          .maybeSingle();
        
        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: WEB_PROFILE_ID,
            telegram_id: 'web_user',
            first_name: 'Web User',
            username: 'web_user',
          });
        }
      }

      if (effectiveProfileId) {
        // Set profile ID in store
        if (profileId !== effectiveProfileId) {
          setProfileId(effectiveProfileId);
        }

        // Load projects from cloud (only once per session)
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          loadProjectsFromCloud(effectiveProfileId);
        }
      }
    };

    initProfile();
  }, [profile?.id, isTgLoading, isTelegramWebApp, profileId, setProfileId, loadProjectsFromCloud]);

  return {
    isLoading: isTgLoading || isSyncing,
    profileId: profile?.id || (isTelegramWebApp ? null : WEB_PROFILE_ID),
    isTelegramWebApp,
  };
}
