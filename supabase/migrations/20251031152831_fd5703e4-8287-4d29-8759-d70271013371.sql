-- Create table for processed documents history
CREATE TABLE IF NOT EXISTS public.processed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  original_text TEXT,
  formatted_text TEXT,
  alerts_count INTEGER DEFAULT 0,
  suggestions_count INTEGER DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read documents (for PoC purposes)
CREATE POLICY "Allow public read access to processed documents" 
ON public.processed_documents 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert documents (for PoC purposes)
CREATE POLICY "Allow public insert access to processed documents" 
ON public.processed_documents 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_processed_documents_processed_at ON public.processed_documents(processed_at DESC);
CREATE INDEX idx_processed_documents_template ON public.processed_documents(template_name);