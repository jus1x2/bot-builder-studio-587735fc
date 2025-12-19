import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface Profile {
  id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  language_code: string | null;
  is_premium: boolean | null;
  created_at: string;
  last_activity_at: string;
}

// Demo user ID for development mode
const DEMO_TELEGRAM_ID = 'demo_user_12345';

// TelegramWebApp interface is defined in vite-env.d.ts

export function useTelegramAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create or get demo profile for development mode
  const createDemoProfile = useCallback(async () => {
    try {
      // Check if demo profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', DEMO_TELEGRAM_ID)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking demo profile:', selectError);
        return null;
      }

      if (existingProfile) {
        // Update last activity
        await supabase
          .from('profiles')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', existingProfile.id);
        return existingProfile as Profile;
      }

      // Create new demo profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          telegram_id: DEMO_TELEGRAM_ID,
          username: 'demo_user',
          first_name: 'Demo',
          last_name: 'User',
          language_code: 'ru',
          is_premium: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating demo profile:', insertError);
        return null;
      }

      return newProfile as Profile;
    } catch (err) {
      console.error('Demo profile error:', err);
      return null;
    }
  }, []);

  const authenticate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tg = window.Telegram?.WebApp;
      
      if (!tg || !tg.initData) {
        // Not in Telegram WebApp context - use demo mode
        setIsTelegramWebApp(false);
        
        // Create demo user for development
        const demoUser: TelegramUser = {
          id: 12345,
          first_name: 'Demo',
          last_name: 'User',
          username: 'demo_user',
          language_code: 'ru',
        };
        setTelegramUser(demoUser);

        // Create or get demo profile from database
        const demoProfile = await createDemoProfile();
        if (demoProfile) {
          setProfile(demoProfile);
          console.log('[TelegramAuth] Demo profile loaded:', demoProfile.id);
        }
        
        setIsLoading(false);
        return;
      }

      setIsTelegramWebApp(true);
      tg.ready();
      tg.expand();

      // Get user from initDataUnsafe for quick display
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }

      // Validate and create/update profile via edge function
      const { data, error: fnError } = await supabase.functions.invoke('telegram-auth', {
        body: { initData: tg.initData }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.profile) {
        setProfile(data.profile);
      }

      if (data?.telegram_user) {
        setTelegramUser(data.telegram_user);
      }
    } catch (err) {
      console.error('Telegram auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [createDemoProfile]);

  useEffect(() => {
    // Wait for Telegram WebApp script to load
    const checkTelegram = () => {
      if (window.Telegram?.WebApp) {
        authenticate();
      } else {
        // Not in Telegram context - start demo mode
        authenticate();
      }
    };

    // Small delay to ensure Telegram SDK is loaded
    const timer = setTimeout(checkTelegram, 100);
    return () => clearTimeout(timer);
  }, [authenticate]);

  const getTheme = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return null;
    
    return {
      colorScheme: tg.colorScheme,
      ...tg.themeParams
    };
  }, []);

  return {
    isLoading,
    isTelegramWebApp,
    telegramUser,
    profile,
    error,
    getTheme,
    authenticate,
  };
}
