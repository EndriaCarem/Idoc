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

  console.log('Chamando edge function format-document...');

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

  console.log('Resposta da edge function:', data);
  console.log('Texto formatado length:', data?.textoFormatado?.length);
  console.log('Alertas:', data?.alertas?.length);
  console.log('Sugestões:', data?.sugestoes?.length);

  if (!data?.textoFormatado) {
    console.error('Resposta sem textoFormatado:', data);
    throw new Error('Resposta da IA está incompleta');
  }

  return data as CopilotResult;
};
