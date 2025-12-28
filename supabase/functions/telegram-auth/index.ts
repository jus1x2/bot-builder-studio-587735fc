import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

async function validateTelegramInitData(initData: string, botToken: string): Promise<TelegramUser | null> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return null;

    urlParams.delete("hash");
    const dataCheckArray: string[] = [];
    urlParams.sort();
    urlParams.forEach((value, key) => {
      dataCheckArray.push(`${key}=${value}`);
    });
    const dataCheckString = dataCheckArray.join("\n");

    // Create secret key using Web Crypto API
    const encoder = new TextEncoder();
    
    // First HMAC: HMAC-SHA256("WebAppData", bot_token)
    const keyData = encoder.encode("WebAppData");
    const secretKeyMaterial = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secretKey = await crypto.subtle.sign(
      "HMAC",
      secretKeyMaterial,
      encoder.encode(botToken)
    );

    // Second HMAC: HMAC-SHA256(secret_key, data_check_string)
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      secretKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      encoder.encode(dataCheckString)
    );

    // Convert to hex
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash !== hash) {
      console.log("Hash mismatch");
      return null;
    }

    // Check auth_date (not older than 24 hours)
    const authDate = parseInt(urlParams.get("auth_date") || "0");
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      console.log("Auth data expired");
      return null;
    }

    // Parse user data
    const userStr = urlParams.get("user");
    if (!userStr) return null;

    return JSON.parse(userStr) as TelegramUser;
  } catch (error) {
    console.error("Validation error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { initData, botToken } = body;

    // Validate initData - must be a non-empty string
    if (!initData || typeof initData !== 'string' || initData.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate botToken if provided - must be a string
    if (botToken !== undefined && (typeof botToken !== 'string' || botToken.length > 100)) {
      return new Response(
        JSON.stringify({ error: "Invalid botToken format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let telegramUser: TelegramUser | null = null;

    // SECURITY: Always validate if botToken is provided
    // If no botToken, check if we're in development mode via env
    const isDevelopment = Deno.env.get("ALLOW_DEV_MODE") === "true";

    if (botToken) {
      telegramUser = await validateTelegramInitData(initData, botToken);
      if (!telegramUser) {
        console.log("Telegram validation failed with provided botToken");
        return new Response(
          JSON.stringify({ error: "Telegram signature validation failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (isDevelopment) {
      // Only allow unvalidated parsing in explicit development mode
      console.warn("DEV MODE: Parsing user without validation - DO NOT USE IN PRODUCTION");
      try {
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get("user");
        if (userStr) {
          const parsed = JSON.parse(userStr);
          // Validate parsed user has required fields
          if (parsed && typeof parsed.id === 'number' && typeof parsed.first_name === 'string') {
            telegramUser = parsed;
          }
        }
      } catch (e) {
        console.log("Could not parse user from initData");
      }
    } else {
      // No botToken and not in dev mode - require botToken
      return new Response(
        JSON.stringify({ error: "Bot token is required for authentication" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired Telegram data" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Additional validation of telegramUser fields
    if (!telegramUser.id || typeof telegramUser.id !== 'number' || telegramUser.id <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram user ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!telegramUser.first_name || typeof telegramUser.first_name !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram user data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize user inputs - prevent XSS/injection
    const sanitize = (str: string | undefined, maxLen: number = 100): string | null => {
      if (!str || typeof str !== 'string') return null;
      return str.slice(0, maxLen).replace(/[<>\"'&]/g, '');
    };

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert profile with sanitized data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        telegram_id: telegramUser.id.toString(),
        username: sanitize(telegramUser.username, 32),
        first_name: sanitize(telegramUser.first_name, 64) || 'User',
        last_name: sanitize(telegramUser.last_name, 64),
        language_code: sanitize(telegramUser.language_code, 10) || "ru",
        is_premium: Boolean(telegramUser.is_premium),
        photo_url: sanitize(telegramUser.photo_url, 500),
        last_activity_at: new Date().toISOString(),
      }, {
        onConflict: "telegram_id",
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to create profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't expose internal profile data, only necessary fields
    const safeProfile = {
      id: profile.id,
      telegram_id: profile.telegram_id,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_premium: profile.is_premium,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: safeProfile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    // Don't expose internal error details
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});