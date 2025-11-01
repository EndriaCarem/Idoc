-- Add color column to folders table
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS color text DEFAULT '#4F86F7';