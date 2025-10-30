-- Tabela para armazenar templates de formatação
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (como os templates são públicos para o usuário, vamos deixar sem autenticação por enquanto)
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (sem autenticação por enquanto)
CREATE POLICY "Permitir todas as operações em templates" 
ON public.templates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();