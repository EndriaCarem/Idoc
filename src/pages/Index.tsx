import { useState } from 'react';
import Header from '@/components/Header';
import DocumentInput from '@/components/DocumentInput';
import CopilotPanel from '@/components/CopilotPanel';
import DocumentPreview from '@/components/DocumentPreview';
import { formatarComCopilot } from '@/services/geminiService';
import { Loader2, Sparkles, CheckCircle } from 'lucide-react';
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
            <div className="text-center mb-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Powered by AI</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-tight">
                Copiloto de Formatação
                <br />
                <span className="text-3xl md:text-4xl">para Relatórios Técnicos</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Automatize a formatação e padronização de relatórios de incentivos fiscais 
                <strong className="text-foreground"> (RA, PPB, MOVER)</strong> com inteligência artificial.
                Economize tempo e garanta conformidade regulatória.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Formatação automática</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Alertas de conformidade</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span>Assistente interativo</span>
                </div>
              </div>
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
