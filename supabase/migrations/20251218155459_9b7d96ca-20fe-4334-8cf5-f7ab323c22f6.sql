-- Create table for bot projects
CREATE TABLE public.bot_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  telegram_bot_token TEXT,
  telegram_bot_username TEXT,
  settings JSONB DEFAULT '{"welcomeMessage": "", "defaultMenuId": ""}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for bot menus
CREATE TABLE public.bot_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_text TEXT DEFAULT '',
  position_x DOUBLE PRECISION DEFAULT 0,
  position_y DOUBLE PRECISION DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for bot buttons
CREATE TABLE public.bot_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.bot_menus(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  row_index INTEGER DEFAULT 0,
  button_order INTEGER DEFAULT 0,
  target_menu_id UUID REFERENCES public.bot_menus(id) ON DELETE SET NULL,
  target_action_id UUID,
  label_position JSONB,
  actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for action nodes
CREATE TABLE public.bot_action_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  position_x DOUBLE PRECISION DEFAULT 0,
  position_y DOUBLE PRECISION DEFAULT 0,
  next_action_id UUID REFERENCES public.bot_action_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user sessions (to track conversation state)
CREATE TABLE public.bot_user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL,
  current_menu_id UUID REFERENCES public.bot_menus(id) ON DELETE SET NULL,
  variables JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0,
  first_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, telegram_user_id)
);

-- Create indexes
CREATE INDEX idx_bot_menus_project ON public.bot_menus(project_id);
CREATE INDEX idx_bot_buttons_menu ON public.bot_buttons(menu_id);
CREATE INDEX idx_bot_action_nodes_project ON public.bot_action_nodes(project_id);
CREATE INDEX idx_bot_user_sessions_project_user ON public.bot_user_sessions(project_id, telegram_user_id);

-- Enable RLS
ALTER TABLE public.bot_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_action_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (bots need to work without auth)
CREATE POLICY "Allow public read for bot projects" ON public.bot_projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert for bot projects" ON public.bot_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for bot projects" ON public.bot_projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for bot projects" ON public.bot_projects FOR DELETE USING (true);

CREATE POLICY "Allow public read for bot menus" ON public.bot_menus FOR SELECT USING (true);
CREATE POLICY "Allow public insert for bot menus" ON public.bot_menus FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for bot menus" ON public.bot_menus FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for bot menus" ON public.bot_menus FOR DELETE USING (true);

CREATE POLICY "Allow public read for bot buttons" ON public.bot_buttons FOR SELECT USING (true);
CREATE POLICY "Allow public insert for bot buttons" ON public.bot_buttons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for bot buttons" ON public.bot_buttons FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for bot buttons" ON public.bot_buttons FOR DELETE USING (true);

CREATE POLICY "Allow public read for bot action nodes" ON public.bot_action_nodes FOR SELECT USING (true);
CREATE POLICY "Allow public insert for bot action nodes" ON public.bot_action_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for bot action nodes" ON public.bot_action_nodes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for bot action nodes" ON public.bot_action_nodes FOR DELETE USING (true);

CREATE POLICY "Allow public read for bot user sessions" ON public.bot_user_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert for bot user sessions" ON public.bot_user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for bot user sessions" ON public.bot_user_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for bot user sessions" ON public.bot_user_sessions FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_bot_projects_updated_at
  BEFORE UPDATE ON public.bot_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_menus_updated_at
  BEFORE UPDATE ON public.bot_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();