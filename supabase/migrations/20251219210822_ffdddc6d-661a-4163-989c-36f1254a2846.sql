-- Таблица для каталога товаров
CREATE TABLE public.bot_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.bot_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  old_price numeric(10,2),
  image_url text,
  sku text,
  stock integer,
  max_quantity integer DEFAULT 10,
  variants text[] DEFAULT '{}',
  category text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Индекс для быстрого поиска по проекту
CREATE INDEX idx_bot_products_project_id ON public.bot_products(project_id);

-- Включаем RLS
ALTER TABLE public.bot_products ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Users can view products in their projects"
ON public.bot_products
FOR SELECT
USING (project_id IN (
  SELECT bot_projects.id FROM bot_projects
  WHERE bot_projects.profile_id IN (SELECT profiles.id FROM profiles)
));

CREATE POLICY "Users can create products in their projects"
ON public.bot_products
FOR INSERT
WITH CHECK (project_id IN (
  SELECT bot_projects.id FROM bot_projects
  WHERE bot_projects.profile_id IN (SELECT profiles.id FROM profiles)
));

CREATE POLICY "Users can update products in their projects"
ON public.bot_products
FOR UPDATE
USING (project_id IN (
  SELECT bot_projects.id FROM bot_projects
  WHERE bot_projects.profile_id IN (SELECT profiles.id FROM profiles)
));

CREATE POLICY "Users can delete products from their projects"
ON public.bot_products
FOR DELETE
USING (project_id IN (
  SELECT bot_projects.id FROM bot_projects
  WHERE bot_projects.profile_id IN (SELECT profiles.id FROM profiles)
));

-- Триггер обновления updated_at
CREATE TRIGGER update_bot_products_updated_at
BEFORE UPDATE ON public.bot_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();