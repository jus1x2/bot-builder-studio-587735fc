-- Drop all old policies to recreate with proper security
-- PROFILES table - fix the overly permissive true policies
DROP POLICY IF EXISTS "Profiles are viewable by owner only" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by auth system" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON public.profiles;

-- BOT_PROJECTS table - recreate with proper checks
DROP POLICY IF EXISTS "Users can view their own projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.bot_projects;

-- BOT_MENUS table
DROP POLICY IF EXISTS "Users can view menus of their projects" ON public.bot_menus;
DROP POLICY IF EXISTS "Users can create menus in their projects" ON public.bot_menus;
DROP POLICY IF EXISTS "Users can update menus in their projects" ON public.bot_menus;
DROP POLICY IF EXISTS "Users can delete menus from their projects" ON public.bot_menus;

-- BOT_BUTTONS table
DROP POLICY IF EXISTS "Users can view buttons in their menus" ON public.bot_buttons;
DROP POLICY IF EXISTS "Users can create buttons in their menus" ON public.bot_buttons;
DROP POLICY IF EXISTS "Users can update buttons in their menus" ON public.bot_buttons;
DROP POLICY IF EXISTS "Users can delete buttons from their menus" ON public.bot_buttons;

-- BOT_ACTION_NODES table
DROP POLICY IF EXISTS "Users can view action nodes in their projects" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Users can create action nodes in their projects" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Users can update action nodes in their projects" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Users can delete action nodes from their projects" ON public.bot_action_nodes;

-- BOT_PRODUCTS table
DROP POLICY IF EXISTS "Users can view products in their projects" ON public.bot_products;
DROP POLICY IF EXISTS "Users can create products in their projects" ON public.bot_products;
DROP POLICY IF EXISTS "Users can update products in their projects" ON public.bot_products;
DROP POLICY IF EXISTS "Users can delete products from their projects" ON public.bot_products;

-- BOT_USER_SESSIONS table
DROP POLICY IF EXISTS "Project owners can view sessions" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Sessions can be created by webhook" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Sessions can be updated" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Project owners can delete sessions" ON public.bot_user_sessions;

-- Create helper function to check if current request has a valid profile
-- This checks the X-Telegram-User-Id header set by the frontend
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles 
  WHERE telegram_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
  LIMIT 1;
$$;

-- PROFILES: Only allow users to see their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (
  telegram_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
);

-- PROFILES: Allow insert from service role (edge functions)
CREATE POLICY "Service can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- PROFILES: Users can update only their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (
  telegram_id = current_setting('request.headers', true)::json->>'x-telegram-user-id'
);

-- BOT_PROJECTS: Users can only access their own projects
CREATE POLICY "Users can view own projects"
ON public.bot_projects FOR SELECT
USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can create own projects"
ON public.bot_projects FOR INSERT
WITH CHECK (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can update own projects"
ON public.bot_projects FOR UPDATE
USING (profile_id = public.get_current_profile_id());

CREATE POLICY "Users can delete own projects"
ON public.bot_projects FOR DELETE
USING (profile_id = public.get_current_profile_id());

-- BOT_MENUS: Access via project ownership
CREATE POLICY "Users can view own menus"
ON public.bot_menus FOR SELECT
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can create own menus"
ON public.bot_menus FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can update own menus"
ON public.bot_menus FOR UPDATE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can delete own menus"
ON public.bot_menus FOR DELETE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

-- BOT_BUTTONS: Access via menu -> project ownership
CREATE POLICY "Users can view own buttons"
ON public.bot_buttons FOR SELECT
USING (menu_id IN (
  SELECT m.id FROM public.bot_menus m 
  JOIN public.bot_projects p ON m.project_id = p.id 
  WHERE p.profile_id = public.get_current_profile_id()
));

CREATE POLICY "Users can create own buttons"
ON public.bot_buttons FOR INSERT
WITH CHECK (menu_id IN (
  SELECT m.id FROM public.bot_menus m 
  JOIN public.bot_projects p ON m.project_id = p.id 
  WHERE p.profile_id = public.get_current_profile_id()
));

CREATE POLICY "Users can update own buttons"
ON public.bot_buttons FOR UPDATE
USING (menu_id IN (
  SELECT m.id FROM public.bot_menus m 
  JOIN public.bot_projects p ON m.project_id = p.id 
  WHERE p.profile_id = public.get_current_profile_id()
));

CREATE POLICY "Users can delete own buttons"
ON public.bot_buttons FOR DELETE
USING (menu_id IN (
  SELECT m.id FROM public.bot_menus m 
  JOIN public.bot_projects p ON m.project_id = p.id 
  WHERE p.profile_id = public.get_current_profile_id()
));

-- BOT_ACTION_NODES: Access via project ownership
CREATE POLICY "Users can view own actions"
ON public.bot_action_nodes FOR SELECT
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can create own actions"
ON public.bot_action_nodes FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can update own actions"
ON public.bot_action_nodes FOR UPDATE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can delete own actions"
ON public.bot_action_nodes FOR DELETE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

-- BOT_PRODUCTS: Access via project ownership
CREATE POLICY "Users can view own products"
ON public.bot_products FOR SELECT
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can create own products"
ON public.bot_products FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can update own products"
ON public.bot_products FOR UPDATE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Users can delete own products"
ON public.bot_products FOR DELETE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

-- BOT_USER_SESSIONS: Project owners can manage sessions, service role can create/update
CREATE POLICY "Project owners can view own sessions"
ON public.bot_user_sessions FOR SELECT
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));

CREATE POLICY "Service can create sessions"
ON public.bot_user_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can update sessions"
ON public.bot_user_sessions FOR UPDATE
USING (true);

CREATE POLICY "Project owners can delete own sessions"
ON public.bot_user_sessions FOR DELETE
USING (project_id IN (SELECT id FROM public.bot_projects WHERE profile_id = public.get_current_profile_id()));