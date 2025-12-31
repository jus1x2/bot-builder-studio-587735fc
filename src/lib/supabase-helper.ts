import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Store the current Telegram user ID for RLS
let currentTelegramUserId: string | null = null;

// Create a new client with custom headers
function createSupabaseClientWithHeaders(telegramId: string | null) {
  const headers: Record<string, string> = {};
  if (telegramId) {
    headers['x-telegram-user-id'] = telegramId;
  }
  
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers,
    },
  });
}

// The current supabase client instance
let supabaseClient = createSupabaseClientWithHeaders(null);

export function setTelegramUserId(telegramId: string | null) {
  if (currentTelegramUserId !== telegramId) {
    currentTelegramUserId = telegramId;
    // Recreate client with new headers
    supabaseClient = createSupabaseClientWithHeaders(telegramId);
  }
}

export function getTelegramUserId(): string | null {
  return currentTelegramUserId;
}

// Get supabase client with proper headers set
export function getAuthenticatedSupabase() {
  return supabaseClient;
}
