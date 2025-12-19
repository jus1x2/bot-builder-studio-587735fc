-- Create profiles table for Telegram users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  language_code TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by the owner based on telegram_id
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (true);

-- Create bot_projects table
CREATE TABLE public.bot_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT DEFAULT 'blank',
  root_menu_id UUID,
  telegram_bot_token TEXT,
  telegram_bot_username TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'exported', 'completed')),
  global_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bot_projects
ALTER TABLE public.bot_projects ENABLE ROW LEVEL SECURITY;

-- Bot projects policies - users can only access their own projects
CREATE POLICY "Users can view their own projects" ON public.bot_projects
  FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Users can create their own projects" ON public.bot_projects
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Users can update their own projects" ON public.bot_projects
  FOR UPDATE USING (profile_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Users can delete their own projects" ON public.bot_projects
  FOR DELETE USING (profile_id IN (SELECT id FROM public.profiles));

-- Create bot_menus table
CREATE TABLE public.bot_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.bot_menus(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  message_text TEXT NOT NULL DEFAULT '',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  menu_order INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  keyword_triggers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bot_menus
ALTER TABLE public.bot_menus ENABLE ROW LEVEL SECURITY;

-- Bot menus policies
CREATE POLICY "Users can view menus of their projects" ON public.bot_menus
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can create menus in their projects" ON public.bot_menus
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can update menus in their projects" ON public.bot_menus
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can delete menus from their projects" ON public.bot_menus
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

-- Create bot_buttons table
CREATE TABLE public.bot_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.bot_menus(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT 'Кнопка',
  row_index INTEGER NOT NULL DEFAULT 0,
  button_order INTEGER NOT NULL DEFAULT 0,
  target_menu_id UUID REFERENCES public.bot_menus(id) ON DELETE SET NULL,
  target_action_id UUID,
  actions JSONB DEFAULT '[]',
  label_position DECIMAL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bot_buttons
ALTER TABLE public.bot_buttons ENABLE ROW LEVEL SECURITY;

-- Bot buttons policies
CREATE POLICY "Users can view buttons in their menus" ON public.bot_buttons
  FOR SELECT USING (
    menu_id IN (
      SELECT bm.id FROM public.bot_menus bm
      JOIN public.bot_projects bp ON bm.project_id = bp.id
      WHERE bp.profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can create buttons in their menus" ON public.bot_buttons
  FOR INSERT WITH CHECK (
    menu_id IN (
      SELECT bm.id FROM public.bot_menus bm
      JOIN public.bot_projects bp ON bm.project_id = bp.id
      WHERE bp.profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can update buttons in their menus" ON public.bot_buttons
  FOR UPDATE USING (
    menu_id IN (
      SELECT bm.id FROM public.bot_menus bm
      JOIN public.bot_projects bp ON bm.project_id = bp.id
      WHERE bp.profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can delete buttons from their menus" ON public.bot_buttons
  FOR DELETE USING (
    menu_id IN (
      SELECT bm.id FROM public.bot_menus bm
      JOIN public.bot_projects bp ON bm.project_id = bp.id
      WHERE bp.profile_id IN (SELECT id FROM public.profiles)
    )
  );

-- Create bot_action_nodes table
CREATE TABLE public.bot_action_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  next_node_id UUID,
  next_node_type TEXT CHECK (next_node_type IN ('action', 'menu')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bot_action_nodes
ALTER TABLE public.bot_action_nodes ENABLE ROW LEVEL SECURITY;

-- Bot action nodes policies
CREATE POLICY "Users can view action nodes in their projects" ON public.bot_action_nodes
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can create action nodes in their projects" ON public.bot_action_nodes
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can update action nodes in their projects" ON public.bot_action_nodes
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can delete action nodes from their projects" ON public.bot_action_nodes
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

-- Create bot_user_sessions table for tracking bot users
CREATE TABLE public.bot_user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL,
  current_menu_id UUID REFERENCES public.bot_menus(id) ON DELETE SET NULL,
  session_data JSONB DEFAULT '{}',
  cart_data JSONB DEFAULT '{}',
  user_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, telegram_user_id)
);

-- Enable RLS on bot_user_sessions
ALTER TABLE public.bot_user_sessions ENABLE ROW LEVEL SECURITY;

-- Bot user sessions policies
CREATE POLICY "Users can view sessions in their projects" ON public.bot_user_sessions
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can create sessions in their projects" ON public.bot_user_sessions
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can update sessions in their projects" ON public.bot_user_sessions
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

CREATE POLICY "Users can delete sessions from their projects" ON public.bot_user_sessions
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.bot_projects 
      WHERE profile_id IN (SELECT id FROM public.profiles)
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_projects_updated_at
  BEFORE UPDATE ON public.bot_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_menus_updated_at
  BEFORE UPDATE ON public.bot_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_buttons_updated_at
  BEFORE UPDATE ON public.bot_buttons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_action_nodes_updated_at
  BEFORE UPDATE ON public.bot_action_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_user_sessions_updated_at
  BEFORE UPDATE ON public.bot_user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bot_projects_profile_id ON public.bot_projects(profile_id);
CREATE INDEX idx_bot_menus_project_id ON public.bot_menus(project_id);
CREATE INDEX idx_bot_buttons_menu_id ON public.bot_buttons(menu_id);
CREATE INDEX idx_bot_action_nodes_project_id ON public.bot_action_nodes(project_id);
CREATE INDEX idx_bot_user_sessions_project_user ON public.bot_user_sessions(project_id, telegram_user_id);