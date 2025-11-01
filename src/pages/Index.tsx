import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DocumentInput from '@/components/DocumentInput';
import CopilotPanel from '@/components/CopilotPanel';
import DocumentPreview from '@/components/DocumentPreview';
import { formatarComCopilot } from '@/services/geminiService';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { CopilotResult } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [originalText, setOriginalText] = useState<string>('');
  const [editableText, setEditableText] = useState<string>('');
  const [originalFilename, setOriginalFilename] = useState<string>('');
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleFileUpload = async (text: string, templateId: string, templateName: string, filename: string) => {
    setOriginalText(text);
    setEditableText(text);
    setOriginalFilename(filename);
    setIsProcessing(true);
    setSelectedTemplateId(templateId);
    
    try {
      toast.info("🔄 Iniciando processamento do documento...");
      
      toast.loading("📄 Analisando documento com IA...", { id: "processing" });
      
      const result = await formatarComCopilot(text, templateId);
      
      toast.dismiss("processing");
      
      // Mostrar alertas encontrados em tempo real
      if (result.alertas && result.alertas.length > 0) {
        toast.warning(`⚠️ ${result.alertas.length} alertas de conformidade encontrados`, { duration: 4000 });
        result.alertas.forEach((alerta, index) => {
          setTimeout(() => {
            toast.warning(alerta, { duration: 6000 });
          }, (index + 1) * 800);
        });
      }
      
      // Mostrar sugestões encontradas
      if (result.sugestoes && result.sugestoes.length > 0) {
        setTimeout(() => {
          toast.info(`💡 ${result.sugestoes.length} sugestões de formatação aplicadas`, { duration: 3000 });
        }, result.alertas.length * 800);
      }
      
      setCopilotResult(result);
      
      // Salvar no histórico
      toast.loading("💾 Salvando no histórico...", { id: "saving" });
      
      // Sanitizar textos antes de salvar
      const sanitizedOriginalText = text.replace(/\0/g, '').trim();
      const sanitizedFormattedText = result.textoFormatado.replace(/\0/g, '').trim();
      
      const { error } = await supabase
        .from('processed_documents')
        .insert({
          template_name: templateName,
          original_filename: originalFilename,
          original_text: sanitizedOriginalText,
          formatted_text: sanitizedFormattedText,
          alerts_count: result.alertas.length,
          suggestions_count: result.sugestoes.length,
        });
      
      toast.dismiss("saving");
      
      if (error) {
        console.error('Erro ao salvar no histórico:', error);
        toast.error("⚠️ Erro ao salvar no histórico");
      } else {
        toast.success("✅ Documento processado e salvo com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast.error("❌ Erro ao processar documento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleReprocess = async () => {
    if (!editableText || !selectedTemplateId) {
      toast.error('Texto ou template não selecionado');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.loading("📄 Reprocessando documento com IA...", { id: "reprocessing" });
      
      const result = await formatarComCopilot(editableText, selectedTemplateId);
      
      toast.dismiss("reprocessing");
      
      if (result.alertas && result.alertas.length > 0) {
        toast.warning(`⚠️ ${result.alertas.length} alertas de conformidade encontrados`, { duration: 4000 });
      }
      
      if (result.sugestoes && result.sugestoes.length > 0) {
        toast.info(`💡 ${result.sugestoes.length} sugestões de formatação aplicadas`, { duration: 3000 });
      }
      
      setCopilotResult(result);
      toast.success("✅ Documento reprocessado com sucesso!");
    } catch (error) {
      console.error('Erro ao reprocessar documento:', error);
      toast.error("❌ Erro ao reprocessar documento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
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
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 space-y-4 px-4">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary" />
                <p className="text-base sm:text-lg text-muted-foreground text-center">Processando documento com IA...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  {/* Editor de Texto */}
                  <Card className="backdrop-blur-xl bg-white/40 dark:bg-card/40 border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Editar Documento Original</span>
                        <Button 
                          onClick={handleReprocess}
                          size="sm"
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Reprocessar
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>Documento Original (editável)</Label>
                        <Textarea
                          value={editableText}
                          onChange={(e) => setEditableText(e.target.value)}
                          rows={12}
                          className="font-mono text-sm resize-none backdrop-blur-sm bg-white/60 dark:bg-background/60"
                          placeholder="O conteúdo do documento aparecerá aqui..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <DocumentPreview 
                    originalText={originalText}
                    formattedText={copilotResult?.textoFormatado || ''}
                    templateName={selectedTemplateId || ''}
                    alertsCount={copilotResult?.alertas.length || 0}
                    suggestionsCount={copilotResult?.sugestoes.length || 0}
                  />
                </div>
                
                <div className="lg:col-span-1">
                  {copilotResult && (
                    <CopilotPanel 
                      sugestoes={copilotResult.sugestoes}
                      alertas={copilotResult.alertas}
                      documentoOriginal={editableText}
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
