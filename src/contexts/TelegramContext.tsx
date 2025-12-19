import React, { createContext, useContext, ReactNode } from 'react';
import { useTelegramAuth, TelegramUser, Profile } from '@/hooks/useTelegramAuth';

interface TelegramContextType {
  isLoading: boolean;
  isTelegramWebApp: boolean;
  telegramUser: TelegramUser | null;
  profile: Profile | null;
  error: string | null;
  getTheme: () => {
    colorScheme: 'light' | 'dark';
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  } | null;
  authenticate: () => Promise<void>;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const telegramAuth = useTelegramAuth();

  return (
    <TelegramContext.Provider value={telegramAuth}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}