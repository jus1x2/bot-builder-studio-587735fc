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
    const { initData, botToken } = await req.json();

    if (!initData) {
      return new Response(
        JSON.stringify({ error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For development/testing without bot token, parse user directly
    let telegramUser: TelegramUser | null = null;

    if (botToken) {
      telegramUser = await validateTelegramInitData(initData, botToken);
    } else {
      // Try to parse user from initData without validation (for development)
      try {
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get("user");
        if (userStr) {
          telegramUser = JSON.parse(userStr);
        }
      } catch (e) {
        console.log("Could not parse user from initData");
      }
    }

    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram data" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        telegram_id: telegramUser.id.toString(),
        username: telegramUser.username || null,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || null,
        language_code: telegramUser.language_code || "ru",
        is_premium: telegramUser.is_premium || false,
        photo_url: telegramUser.photo_url || null,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile,
        telegram_user: telegramUser 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});