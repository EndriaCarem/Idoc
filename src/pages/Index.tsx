import { useState } from 'react';
import Header from '@/components/Header';
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
    
    try {
      const result = await formatarComCopilot(text, templateId);
      setCopilotResult(result);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {!originalText ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Copiloto de Formatação
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Formatação inteligente de relatórios técnicos e regulatórios com IA
              </p>
            </div>
            
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
      </main>
    </div>
  );
};

export default Index;
