-- Add media_url column to bot_menus table
ALTER TABLE public.bot_menus
ADD COLUMN media_url text DEFAULT NULL;