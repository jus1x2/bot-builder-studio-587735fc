-- Таблица профилей пользователей Telegram
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  language_code text DEFAULT 'ru',
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Добавляем user_id к проектам
ALTER TABLE public.bot_projects 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Индексы
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX idx_bot_projects_user_id ON public.bot_projects(user_id);

-- RLS для profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (true);

CREATE POLICY "Allow insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Обновляем политики bot_projects - только владелец
DROP POLICY IF EXISTS "Allow public read for bot projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Allow public insert for bot projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Allow public update for bot projects" ON public.bot_projects;
DROP POLICY IF EXISTS "Allow public delete for bot projects" ON public.bot_projects;

CREATE POLICY "Owner can read own projects"
ON public.bot_projects FOR SELECT
USING (user_id IS NULL OR user_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Owner can insert projects"
ON public.bot_projects FOR INSERT
WITH CHECK (true);

CREATE POLICY "Owner can update own projects"
ON public.bot_projects FOR UPDATE
USING (user_id IS NULL OR user_id IN (SELECT id FROM public.profiles));

CREATE POLICY "Owner can delete own projects"
ON public.bot_projects FOR DELETE
USING (user_id IS NULL OR user_id IN (SELECT id FROM public.profiles));

-- Обновляем политики bot_menus
DROP POLICY IF EXISTS "Allow public read for bot menus" ON public.bot_menus;
DROP POLICY IF EXISTS "Allow public insert for bot menus" ON public.bot_menus;
DROP POLICY IF EXISTS "Allow public update for bot menus" ON public.bot_menus;
DROP POLICY IF EXISTS "Allow public delete for bot menus" ON public.bot_menus;

CREATE POLICY "Owner can read own menus"
ON public.bot_menus FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.bot_projects 
    WHERE user_id IS NULL OR user_id IN (SELECT id FROM public.profiles)
  )
);

CREATE POLICY "Owner can insert menus"
ON public.bot_menus FOR INSERT
WITH CHECK (true);

CREATE POLICY "Owner can update own menus"
ON public.bot_menus FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM public.bot_projects 
    WHERE user_id IS NULL OR user_id IN (SELECT id FROM public.profiles)
  )
);

CREATE POLICY "Owner can delete own menus"
ON public.bot_menus FOR DELETE
USING (
  project_id IN (
    SELECT id FROM public.bot_projects 
    WHERE user_id IS NULL OR user_id IN (SELECT id FROM public.profiles)
  )
);

-- Обновляем политики bot_buttons  
DROP POLICY IF EXISTS "Allow public read for bot buttons" ON public.bot_buttons;
DROP POLICY IF EXISTS "Allow public insert for bot buttons" ON public.bot_buttons;
DROP POLICY IF EXISTS "Allow public update for bot buttons" ON public.bot_buttons;
DROP POLICY IF EXISTS "Allow public delete for bot buttons" ON public.bot_buttons;

CREATE POLICY "Owner can read own buttons"
ON public.bot_buttons FOR SELECT
USING (
  menu_id IN (
    SELECT m.id FROM public.bot_menus m
    JOIN public.bot_projects p ON m.project_id = p.id
    WHERE p.user_id IS NULL OR p.user_id IN (SELECT id FROM public.profiles)
  )
);

CREATE POLICY "Owner can insert buttons"
ON public.bot_buttons FOR INSERT
WITH CHECK (true);

CREATE POLICY "Owner can update own buttons"
ON public.bot_buttons FOR UPDATE
USING (
  menu_id IN (
    SELECT m.id FROM public.bot_menus m
    JOIN public.bot_projects p ON m.project_id = p.id
    WHERE p.user_id IS NULL OR p.user_id IN (SELECT id FROM public.profiles)
  )
);

CREATE POLICY "Owner can delete own buttons"
ON public.bot_buttons FOR DELETE
USING (
  menu_id IN (
    SELECT m.id FROM public.bot_menus m
    JOIN public.bot_projects p ON m.project_id = p.id
    WHERE p.user_id IS NULL OR p.user_id IN (SELECT id FROM public.profiles)
  )
);

-- Обновляем политики bot_action_nodes
DROP POLICY IF EXISTS "Allow public read for bot action nodes" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Allow public insert for bot action nodes" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Allow public update for bot action nodes" ON public.bot_action_nodes;
DROP POLICY IF EXISTS "Allow public delete for bot action nodes" ON public.bot_action_nodes;

CREATE POLICY "Owner can read own action nodes"
ON public.bot_action_nodes FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.bot_projects 
    WHERE user_id IS NULL OR user_id IN (SELECT id FROM public.profiles)
  )
);

CREATE POLICY "Owner can insert action nodes"
ON public.bot_action_nodes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Owner can update own action nodes"
ON public.bot_action_nodes FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM public.bot_projects 
    WHERE user_id IS NULL OR user_id IN (SELECT id FROM public.profiles)
  )
);

CREATE POLICY "Owner can delete own action nodes"
ON public.bot_action_nodes FOR DELETE
USING (
  project_id IN (
    SELECT id FROM public.bot_projects 
    WHERE user_id IS NULL OR user_id IN (SELECT id FROM public.profiles)
  )
);