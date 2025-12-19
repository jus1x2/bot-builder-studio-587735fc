import { useEffect, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useProjectStore } from '@/stores/projectStore';
import { supabase } from '@/integrations/supabase/client';

// Demo profile ID for web mode
const DEMO_PROFILE_ID = '179254b7-9d65-46c0-913f-ddeb74a26183';

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

      // If not in Telegram context, use or create demo profile
      if (!effectiveProfileId && !isTelegramWebApp) {
        console.log('[ProjectSync] Not in Telegram WebApp, using demo profile');
        effectiveProfileId = DEMO_PROFILE_ID;
        
        // Ensure demo profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', DEMO_PROFILE_ID)
          .maybeSingle();
        
        if (!existingProfile) {
          console.log('[ProjectSync] Creating demo profile');
          await supabase.from('profiles').insert({
            id: DEMO_PROFILE_ID,
            telegram_id: 'demo_user_web',
            first_name: 'Demo User',
            username: 'demo_user',
          });
        }
      }

      if (effectiveProfileId) {
        // Set profile ID in store
        if (profileId !== effectiveProfileId) {
          console.log('[ProjectSync] Setting profile ID:', effectiveProfileId);
          setProfileId(effectiveProfileId);
        }

        // Load projects from cloud (only once per session)
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          console.log('[ProjectSync] Loading projects from cloud for profile:', effectiveProfileId);
          loadProjectsFromCloud(effectiveProfileId);
        }
      }
    };

    initProfile();
  }, [profile?.id, isTgLoading, isTelegramWebApp, profileId, setProfileId, loadProjectsFromCloud]);

  return {
    isLoading: isTgLoading || isSyncing,
    profileId: profile?.id || (isTelegramWebApp ? null : DEMO_PROFILE_ID),
    isTelegramWebApp,
  };
}
