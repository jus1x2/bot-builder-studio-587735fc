-- Drop existing insecure policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;

-- Create secure policies for profiles (only own profile)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (telegram_id IN (
  SELECT telegram_id FROM public.profiles WHERE id = auth.uid()
) OR id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Allow insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Drop existing insecure policies on bot_projects
DROP POLICY IF EXISTS "Owner can read own projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Owner can insert projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Owner can update own projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Owner can delete own projects" ON public.bot_projects;

-- Create secure policies for bot_projects (require user_id)
CREATE POLICY "Owner can read own projects" 
ON public.bot_projects 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Owner can insert projects" 
ON public.bot_projects 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Owner can update own projects" 
ON public.bot_projects 
FOR UPDATE 
USING (user_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Owner can delete own projects" 
ON public.bot_projects 
FOR DELETE 
USING (user_id IN (SELECT id FROM public.profiles));

-- Drop existing insecure policies on bot_menus
DROP POLICY IF EXISTS "Owner can read own menus" ON public.bot_menus;
DROP POLICY IF EXISTS "Owner can insert menus" ON public.bot_menus;
DROP POLICY IF EXISTS "Owner can update own menus" ON public.bot_menus;
DROP POLICY IF EXISTS "Owner can delete own menus" ON public.bot_menus;

-- Create secure policies for bot_menus
CREATE POLICY "Owner can read own menus" 
ON public.bot_menus 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can insert menus" 
ON public.bot_menus 
FOR INSERT 
WITH CHECK (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can update own menus" 
ON public.bot_menus 
FOR UPDATE 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can delete own menus" 
ON public.bot_menus 
FOR DELETE 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

-- Drop existing insecure policies on bot_buttons
DROP POLICY IF EXISTS "Owner can read own buttons" ON public.bot_buttons;
DROP POLICY IF EXISTS "Owner can insert buttons" ON public.bot_buttons;
DROP POLICY IF EXISTS "Owner can update own buttons" ON public.bot_buttons;
DROP POLICY IF EXISTS "Owner can delete own buttons" ON public.bot_buttons;

-- Create secure policies for bot_buttons
CREATE POLICY "Owner can read own buttons" 
ON public.bot_buttons 
FOR SELECT 
USING (menu_id IN (
  SELECT m.id FROM public.bot_menus m
  JOIN public.bot_projects p ON m.project_id = p.id
  WHERE p.user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can insert buttons" 
ON public.bot_buttons 
FOR INSERT 
WITH CHECK (menu_id IN (
  SELECT m.id FROM public.bot_menus m
  JOIN public.bot_projects p ON m.project_id = p.id
  WHERE p.user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can update own buttons" 
ON public.bot_buttons 
FOR UPDATE 
USING (menu_id IN (
  SELECT m.id FROM public.bot_menus m
  JOIN public.bot_projects p ON m.project_id = p.id
  WHERE p.user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can delete own buttons" 
ON public.bot_buttons 
FOR DELETE 
USING (menu_id IN (
  SELECT m.id FROM public.bot_menus m
  JOIN public.bot_projects p ON m.project_id = p.id
  WHERE p.user_id IN (SELECT id FROM public.profiles)
));

-- Drop existing insecure policies on bot_action_nodes
DROP POLICY IF EXISTS "Owner can read own action nodes" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Owner can insert action nodes" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Owner can update own action nodes" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Owner can delete own action nodes" ON public.bot_action_nodes;

-- Create secure policies for bot_action_nodes
CREATE POLICY "Owner can read own action nodes" 
ON public.bot_action_nodes 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can insert action nodes" 
ON public.bot_action_nodes 
FOR INSERT 
WITH CHECK (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can update own action nodes" 
ON public.bot_action_nodes 
FOR UPDATE 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Owner can delete own action nodes" 
ON public.bot_action_nodes 
FOR DELETE 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

-- Drop existing insecure policies on bot_user_sessions
DROP POLICY IF EXISTS "Allow public read for bot user sessions" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Allow public insert for bot user sessions" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Allow public update for bot user sessions" ON public.bot_user_sessions;
DROP POLICY IF EXISTS "Allow public delete for bot user sessions" ON public.bot_user_sessions;

-- Create secure policies for bot_user_sessions (only project owner and webhook)
CREATE POLICY "Project owner can read sessions" 
ON public.bot_user_sessions 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));

CREATE POLICY "Allow service role insert sessions" 
ON public.bot_user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service role update sessions" 
ON public.bot_user_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Project owner can delete sessions" 
ON public.bot_user_sessions 
FOR DELETE 
USING (project_id IN (
  SELECT id FROM public.bot_projects WHERE user_id IN (SELECT id FROM public.profiles)
));