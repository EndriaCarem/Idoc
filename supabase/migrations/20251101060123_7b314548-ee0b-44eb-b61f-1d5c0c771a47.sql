-- Create file_tags table
CREATE TABLE public.file_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📄',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_tags
CREATE POLICY "Users can view their own tags"
ON public.file_tags
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
ON public.file_tags
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.file_tags
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.file_tags
FOR DELETE
USING (auth.uid() = user_id);

-- Create uploaded_files table
CREATE TABLE public.uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for uploaded_files
CREATE POLICY "Users can view their own files"
ON public.uploaded_files
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own files"
ON public.uploaded_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
ON public.uploaded_files
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON public.uploaded_files
FOR DELETE
USING (auth.uid() = user_id);

-- Add tag_id and tag_emoji to shared_documents
ALTER TABLE public.shared_documents 
ADD COLUMN tag_id UUID REFERENCES public.file_tags(id) ON DELETE SET NULL,
ADD COLUMN tag_name TEXT,
ADD COLUMN tag_emoji TEXT DEFAULT '📄';

-- Create file_shares table for uploaded files
CREATE TABLE public.file_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL,
  shared_with_user_id UUID NOT NULL,
  tag_id UUID REFERENCES public.file_tags(id) ON DELETE SET NULL,
  tag_name TEXT,
  tag_emoji TEXT DEFAULT '📄',
  permission TEXT DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_shares
CREATE POLICY "Users can view shares for their files or shared with them"
ON public.file_shares
FOR SELECT
USING ((shared_by_user_id = auth.uid()) OR (shared_with_user_id = auth.uid()));

CREATE POLICY "Users can share their own files"
ON public.file_shares
FOR INSERT
WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares"
ON public.file_shares
FOR DELETE
USING (auth.uid() = shared_by_user_id);

-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false);

-- Storage policies for user-files bucket
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at on uploaded_files
CREATE TRIGGER update_uploaded_files_updated_at
BEFORE UPDATE ON public.uploaded_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();