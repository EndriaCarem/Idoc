import { supabase } from '@/integrations/supabase/client';
import type { CopilotResult } from '@/types';

export const formatarComCopilot = async (
  texto: string,
  templateId: string
): Promise<CopilotResult> => {
  // Buscar o template do banco de dados
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    throw new Error('Template não encontrado');
  }

  // Chamar edge function com IA real
  const { data, error: functionError } = await supabase.functions.invoke('format-document', {
    body: { 
      documentText: texto,
      templateContent: template.content,
      templateName: template.name
    }
  });

  if (functionError) {
    console.error('Erro na edge function:', functionError);
    throw new Error('Erro ao processar documento com IA');
  }

  return data as CopilotResult;
};
