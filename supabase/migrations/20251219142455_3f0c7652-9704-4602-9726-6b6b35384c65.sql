-- Drop the security definer view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.bot_projects_safe;

-- Create the view with explicit SECURITY INVOKER to use querying user's permissions
CREATE VIEW public.bot_projects_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, name, user_id, settings, created_at, updated_at,
  telegram_bot_username,
  CASE 
    WHEN telegram_bot_token IS NOT NULL THEN '••••••••' 
    ELSE NULL 
  END as telegram_bot_token_masked
FROM public.bot_projects;