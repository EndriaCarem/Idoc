import { supabase } from '@/integrations/supabase/client';
import type { CopilotResult } from '@/types';

export const formatarComCopilot = async (
  texto: string,
  templateId: string
): Promise<CopilotResult> => {
  console.log('📋 Buscando template:', templateId);
  
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    console.error('❌ Template não encontrado:', error);
    throw new Error('Template não encontrado');
  }

  console.log('✅ Template encontrado:', template.name);
  console.log('🚀 Chamando edge function format-document...');

  const { data, error: functionError } = await supabase.functions.invoke('format-document', {
    body: { 
      documentText: texto,
      templateContent: template.content,
      templateName: template.name
    }
  });

  if (functionError) {
    console.error('❌ Erro na edge function:', functionError);
    throw new Error('Erro ao processar documento com IA');
  }

  console.log('📦 Dados recebidos da edge function:', {
    hasData: !!data,
    dataType: typeof data,
    keys: data ? Object.keys(data) : []
  });

  if (!data) {
    console.error('❌ Edge function não retornou dados');
    throw new Error('Edge function não retornou dados');
  }

  // Verificar estrutura do resultado
  const result = data as CopilotResult;
  
  if (!result.textoFormatado) {
    console.error('❌ Resultado sem textoFormatado:', result);
    throw new Error('Resultado da IA não contém texto formatado');
  }

  if (!Array.isArray(result.alertas)) {
    console.warn('⚠️ Alertas não é array, corrigindo...');
    result.alertas = [];
  }

  if (!Array.isArray(result.sugestoes)) {
    console.warn('⚠️ Sugestões não é array, corrigindo...');
    result.sugestoes = [];
  }

  console.log('✅ Resultado validado:', {
    textoFormatadoLength: result.textoFormatado.length,
    alertasCount: result.alertas.length,
    sugestoesCount: result.sugestoes.length
  });

  return result;
};
