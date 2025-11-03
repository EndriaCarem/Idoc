import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DocumentInput from '@/components/DocumentInput';
import CopilotPanel from '@/components/CopilotPanel';
import DocumentPreview from '@/components/DocumentPreview';
import LoadingRobot from '@/components/LoadingRobot';
import { formatarComCopilot } from '@/services/geminiService';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { CopilotResult } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  // Verificar sessionStorage ANTES de inicializar estados
  const hasCopilotData = !!sessionStorage.getItem('copilot_doc');
  
  const [originalText, setOriginalText] = useState<string>('');
  const [editableText, setEditableText] = useState<string>('');
  const [originalFilename, setOriginalFilename] = useState<string>('');
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(hasCopilotData); // Iniciar como true se houver dados
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Carregar documento se vier do sessionStorage
  useEffect(() => {
    const copilotData = sessionStorage.getItem('copilot_doc');
    console.log('Dados do copilot no sessionStorage:', copilotData);
    
    if (copilotData) {
      try {
        const data = JSON.parse(copilotData);
        console.log('Dados parseados:', data);
        sessionStorage.removeItem('copilot_doc'); // Limpar após ler
        
        if (data.type === 'processed') {
          console.log('Carregando documento processado:', data.id);
          loadDocumentFromId(data.id, data.document_group_id);
        } else if (data.type === 'file') {
          console.log('Carregando arquivo:', data.filename);
          // Se templateId foi fornecido, usar ele; senão buscar o mais recente
          if (data.templateId && data.templateName) {
            loadFromFileContent(data.content, data.filename, data.document_group_id, data.templateId, data.templateName);
          } else {
            loadFromFileContent(data.content, data.filename, data.document_group_id);
          }
        }
      } catch (error) {
        console.error('Erro ao processar dados do copilot:', error);
        toast.error('Erro ao carregar documento');
        setIsProcessing(false);
      }
    }
  }, []);

  const loadFromFileContent = async (content: string, filename: string, documentGroupId?: string, templateId?: string, templateName?: string) => {
    try {
      // Se templateId foi fornecido, usar ele
      if (templateId && templateName) {
        setOriginalText(content);
        setEditableText(content);
        setOriginalFilename(filename);
        setSelectedTemplateId(templateId);
        
        handleFileUpload(content, templateId, templateName, filename, documentGroupId);
        return;
      }

      // Senão buscar o primeiro template disponível
      const { data: templates } = await supabase
        .from('templates')
        .select('id, name')
        .order('created_at', { ascending: false })
        .limit(1);

      if (templates && templates.length > 0) {
        const template = templates[0];
        setOriginalText(content);
        setEditableText(content);
        setOriginalFilename(filename);
        setSelectedTemplateId(template.id);
        
        // Processar automaticamente (isProcessing já está true do useEffect)
        handleFileUpload(content, template.id, template.name, filename, documentGroupId);
      } else {
        toast.error('Nenhum template disponível. Crie um template primeiro.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
      setIsProcessing(false);
    }
  };

  const loadDocumentFromId = async (docId: string, documentGroupId?: string) => {
    try {
      console.log('Buscando documento saved_documents id:', docId);
      
      // Primeiro tentar buscar em saved_documents
      const { data: savedDoc, error: savedError } = await supabase
        .from('saved_documents')
        .select('*')
        .eq('id', docId)
        .maybeSingle();

      console.log('Resultado saved_documents:', { savedDoc, savedError });

      if (savedDoc) {
        // Buscar o template_id baseado no template_name
        const { data: templateData } = await supabase
          .from('templates')
          .select('id')
          .eq('name', savedDoc.template_name)
          .maybeSingle();

        const templateId = templateData?.id || null;
        console.log('Template encontrado:', templateId);
        
        setOriginalText(savedDoc.original_text || savedDoc.formatted_text);
        setEditableText(savedDoc.original_text || savedDoc.formatted_text);
        setOriginalFilename(savedDoc.name);
        setSelectedTemplateId(templateId);
        
        // Processar automaticamente (isProcessing já está true do useEffect)
        if (templateId && savedDoc.template_name) {
          handleFileUpload(
            savedDoc.original_text || savedDoc.formatted_text, 
            templateId, 
            savedDoc.template_name, 
            savedDoc.name
          );
        } else {
          setIsProcessing(false);
        }
        return;
      }

      // Se não encontrou em saved_documents, tentar processed_documents
      console.log('Buscando em processed_documents id:', docId);
      const { data: processedDoc, error: processedError } = await supabase
        .from('processed_documents')
        .select('*')
        .eq('id', docId)
        .maybeSingle();

      console.log('Resultado processed_documents:', { processedDoc, processedError });

      if (processedDoc) {
        // Buscar o template_id baseado no template_name
        const { data: templateData } = await supabase
          .from('templates')
          .select('id')
          .eq('name', processedDoc.template_name)
          .maybeSingle();

        const templateId = templateData?.id || null;
        
        setOriginalText(processedDoc.original_text || processedDoc.formatted_text);
        setEditableText(processedDoc.original_text || processedDoc.formatted_text);
        setOriginalFilename(processedDoc.original_filename || 'documento.txt');
        setSelectedTemplateId(templateId);
        
        // Processar automaticamente (isProcessing já está true do useEffect)
        if (templateId) {
          handleFileUpload(
            processedDoc.original_text || processedDoc.formatted_text, 
            templateId, 
            processedDoc.template_name, 
            processedDoc.original_filename || 'documento.txt'
          );
        } else {
          setIsProcessing(false);
        }
        return;
      }
      
      toast.error('Documento não encontrado');
      setIsProcessing(false);
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar documento');
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (text: string, templateId: string, templateName: string, filename: string, documentGroupId?: string) => {
    // Não setar estados de documento aqui pois já foram setados antes
    // Apenas garantir que isProcessing está true
    if (!isProcessing) {
      setIsProcessing(true);
    }
    
    try {
      console.log('🚀 Iniciando processamento do documento...');
      toast.info("🔄 Iniciando processamento do documento...");
      
      toast.loading("📄 Analisando documento com IA...", { id: "processing" });
      
      console.log('📤 Enviando para IA:', { templateId, textLength: text.length });
      const result = await formatarComCopilot(text, templateId);
      
      console.log('📥 Resultado recebido da IA:', {
        hasTextoFormatado: !!result.textoFormatado,
        textoFormatadoLength: result.textoFormatado?.length || 0,
        alertasCount: result.alertas?.length || 0,
        sugestoesCount: result.sugestoes?.length || 0
      });
      
      toast.dismiss("processing");
      
      // Verificar se o resultado está completo
      if (!result.textoFormatado) {
        console.error('❌ Resultado sem texto formatado!');
        toast.error("Erro: Documento não foi formatado corretamente");
        return;
      }
      
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
      
      console.log('✅ Definindo copilotResult...');
      setCopilotResult(result);
      console.log('✅ copilotResult definido com sucesso');
      
      // Salvar no histórico
      toast.loading("💾 Salvando no histórico...", { id: "saving" });
      
      // Sanitizar textos antes de salvar
      const sanitizedOriginalText = text.replace(/\0/g, '').trim();
      const sanitizedFormattedText = result.textoFormatado.replace(/\0/g, '').trim();
      
      // Buscar user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const { error } = await supabase
        .from('processed_documents')
        .insert({
          template_name: templateName,
          original_filename: filename,
          original_text: sanitizedOriginalText,
          formatted_text: sanitizedFormattedText,
          alerts_count: result.alertas.length,
          suggestions_count: result.sugestoes.length,
          user_id: user.id,
          document_group_id: documentGroupId || undefined,
        });
      
      toast.dismiss("saving");
      
      if (error) {
        console.error('Erro ao salvar no histórico:', error);
        toast.error("⚠️ Erro ao salvar no histórico");
      } else {
        toast.success("✅ Documento processado e salvo com sucesso!");
      }
    } catch (error) {
      console.error('❌ Erro ao processar documento:', error);
      toast.error("❌ Erro ao processar documento. Tente novamente.");
      setCopilotResult(null);
    } finally {
      console.log('🏁 Finalizando processamento...');
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
          isProcessing ? (
            <LoadingRobot message="Carregando documento..." />
          ) : (
            <div className="max-w-4xl mx-auto">
              <DocumentInput 
                onFileUpload={handleFileUpload}
                selectedTemplateId={selectedTemplateId}
                onTemplateChange={handleTemplateChange}
              />
            </div>
          )
        ) : (
          <>
            {isProcessing ? (
              <LoadingRobot message="Processando documento com IA..." />
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
