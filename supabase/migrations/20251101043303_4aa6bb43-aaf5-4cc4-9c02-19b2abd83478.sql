-- Create folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create saved_documents table
CREATE TABLE public.saved_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_text TEXT,
  formatted_text TEXT NOT NULL,
  template_name TEXT,
  alerts_count INTEGER DEFAULT 0,
  suggestions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on saved_documents
ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;

-- Create shared_folders table for folder sharing
CREATE TABLE public.shared_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID NOT NULL,
  shared_with_user_id UUID NOT NULL,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(folder_id, shared_with_user_id)
);

-- Enable RLS on shared_folders
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;

-- Create shared_documents table for document sharing
CREATE TABLE public.shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.saved_documents(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID NOT NULL,
  shared_with_user_id UUID NOT NULL,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(document_id, shared_with_user_id)
);

-- Enable RLS on shared_documents
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

-- Folders policies
CREATE POLICY "Users can view their own folders and shared folders"
ON public.folders FOR SELECT
USING (
  user_id = auth.uid() 
  OR id IN (
    SELECT folder_id FROM public.shared_folders 
    WHERE shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own folders"
ON public.folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON public.folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON public.folders FOR DELETE
USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own documents and shared documents"
ON public.saved_documents FOR SELECT
USING (
  user_id = auth.uid() 
  OR id IN (
    SELECT document_id FROM public.shared_documents 
    WHERE shared_with_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own documents"
ON public.saved_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.saved_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.saved_documents FOR DELETE
USING (auth.uid() = user_id);

-- Shared folders policies
CREATE POLICY "Users can view shares for their folders or shared with them"
ON public.shared_folders FOR SELECT
USING (
  shared_by_user_id = auth.uid() 
  OR shared_with_user_id = auth.uid()
);

CREATE POLICY "Users can share their own folders"
ON public.shared_folders FOR INSERT
WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares"
ON public.shared_folders FOR DELETE
USING (auth.uid() = shared_by_user_id);

-- Shared documents policies
CREATE POLICY "Users can view shares for their documents or shared with them"
ON public.shared_documents FOR SELECT
USING (
  shared_by_user_id = auth.uid() 
  OR shared_with_user_id = auth.uid()
);

CREATE POLICY "Users can share their own documents"
ON public.shared_documents FOR INSERT
WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares"
ON public.shared_documents FOR DELETE
USING (auth.uid() = shared_by_user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_documents_updated_at
BEFORE UPDATE ON public.saved_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();