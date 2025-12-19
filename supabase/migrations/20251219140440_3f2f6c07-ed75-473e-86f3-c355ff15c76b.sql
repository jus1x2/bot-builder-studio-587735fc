-- Fix profiles policy to only allow viewing own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id IN (SELECT id FROM public.profiles WHERE telegram_id IN (
  SELECT telegram_id FROM public.profiles WHERE id = auth.uid()
)));

-- Fix profiles insert policy - only edge functions should create profiles
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;

-- Allow insert only for service role (edge functions)
CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Create a view that hides telegram_bot_token from regular users
CREATE OR REPLACE VIEW public.bot_projects_safe AS
SELECT 
  id, name, user_id, settings, created_at, updated_at,
  telegram_bot_username,
  CASE 
    WHEN telegram_bot_token IS NOT NULL THEN '••••••••' 
    ELSE NULL 
  END as telegram_bot_token_masked
FROM public.bot_projects;

-- Fix bot_user_sessions to be more secure
DROP POLICY IF EXISTS "Allow service role insert sessions" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Allow service role update sessions" ON public.bot_user_sessions;

-- Only allow webhook (service role) to manage sessions
CREATE POLICY "Webhook can insert sessions" 
ON public.bot_user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Webhook can update sessions" 
ON public.bot_user_sessions 
FOR UPDATE 
USING (true);