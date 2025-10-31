import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DocumentInput from '@/components/DocumentInput';
import CopilotPanel from '@/components/CopilotPanel';
import DocumentPreview from '@/components/DocumentPreview';
import { formatarComCopilot } from '@/services/geminiService';
import { Loader2 } from 'lucide-react';
import type { CopilotResult } from '@/types';

const Index = () => {
  const [originalText, setOriginalText] = useState<string>('');
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleFileUpload = async (text: string, templateId: string) => {
    setOriginalText(text);
    setIsProcessing(true);
    setSelectedTemplateId(templateId);
    
    try {
      const result = await formatarComCopilot(text, templateId);
      setCopilotResult(result);
      
      // Salvar no histórico
      const { error } = await supabase
        .from('processed_documents')
        .insert({
          template_name: templateId,
          original_filename: 'Documento.txt',
          original_text: text,
          formatted_text: result.textoFormatado,
          alerts_count: result.alertas.length,
          suggestions_count: result.sugestoes.length,
        });
      
      if (error) console.error('Erro ao salvar no histórico:', error);
    } catch (error) {
      console.error('Erro ao processar documento:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
        {!originalText ? (
          <div className="max-w-4xl mx-auto">
            <DocumentInput 
              onFileUpload={handleFileUpload}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={handleTemplateChange}
            />
          </div>
        ) : (
          <>
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Processando documento com IA...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <DocumentPreview 
                    originalText={originalText}
                    formattedText={copilotResult?.textoFormatado || ''}
                  />
                </div>
                
                <div className="lg:col-span-1">
                  {copilotResult && (
                    <CopilotPanel 
                      sugestoes={copilotResult.sugestoes}
                      alertas={copilotResult.alertas}
                      documentoOriginal={originalText}
                      documentoFormatado={copilotResult.textoFormatado}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default Index;
