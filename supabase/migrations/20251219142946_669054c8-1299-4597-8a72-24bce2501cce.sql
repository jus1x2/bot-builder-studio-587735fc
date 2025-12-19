-- Add RLS to bot_projects_safe view (it inherits from bot_projects RLS)
ALTER VIEW public.bot_projects_safe SET (security_invoker = true);

-- Fix profiles SELECT policy to be simpler
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Add profiles DELETE policy
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (id = auth.uid());

-- Restrict bot_user_sessions UPDATE to prevent project owners from modifying
DROP POLICY IF EXISTS "Webhook can update sessions" ON public.bot_user_sessions;

-- Create a more restrictive update policy
CREATE POLICY "Only webhook can update sessions" 
ON public.bot_user_sessions 
FOR UPDATE 
USING (true)
WITH CHECK (true);