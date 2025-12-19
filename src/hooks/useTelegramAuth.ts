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

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  colorScheme: 'light' | 'dark';
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegramAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tg = window.Telegram?.WebApp;
      
      if (!tg || !tg.initData) {
        // Not in Telegram WebApp context
        setIsTelegramWebApp(false);
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
  }, []);

  useEffect(() => {
    // Wait for Telegram WebApp script to load
    const checkTelegram = () => {
      if (window.Telegram?.WebApp) {
        authenticate();
      } else {
        // Not in Telegram context, set loading to false
        setIsLoading(false);
        setIsTelegramWebApp(false);
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