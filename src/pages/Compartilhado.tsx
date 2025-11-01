import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Trash2, Users, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarComCopilot } from '@/services/geminiService';
import type { CopilotResult } from '@/types';
import CopilotPanel from '@/components/CopilotPanel';

interface SharedDocument {
  id: string;
  document_id: string;
  shared_by_user_id: string;
  created_at: string;
  document: {
    id: string;
    name: string;
    formatted_text: string;
    template_name: string;
    created_at: string;
  };
  shared_by: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Template {
  id: string;
  name: string;
}

const Compartilhado = () => {
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument['document'] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);

  useEffect(() => {
    loadSharedDocuments();
    loadTemplates();
  }, []);

  const loadSharedDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Dados fictícios para demonstração
      const mockData: SharedDocument[] = [
        {
          id: 'mock-1',
          document_id: 'doc-1',
          shared_by_user_id: 'user-1',
          created_at: new Date().toISOString(),
          document: {
            id: 'doc-1',
            name: 'Contrato de Prestação de Serviços - Revisado',
            formatted_text: 'Conteúdo do documento...',
            template_name: 'Template Jurídico',
            created_at: new Date().toISOString(),
          },
          shared_by: {
            full_name: 'Dr. Carlos Silva',
            avatar_url: 'https://i.pravatar.cc/150?img=12',
          },
        },
        {
          id: 'mock-2',
          document_id: 'doc-2',
          shared_by_user_id: 'user-2',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          document: {
            id: 'doc-2',
            name: 'Relatório de Análise Técnica Q1 2024',
            formatted_text: 'Conteúdo do relatório...',
            template_name: 'Template Técnico',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          shared_by: {
            full_name: 'Ana Paula Costa',
            avatar_url: 'https://i.pravatar.cc/150?img=47',
          },
        },
      ];

      setSharedDocuments(mockData);

      /* Código real comentado para quando houver dados reais
      const { data, error } = await supabase
        .from('shared_documents')
        .select(`
          id,
          document_id,
          shared_by_user_id,
          created_at,
          document:saved_documents!document_id(
            id,
            name,
            formatted_text,
            template_name,
            created_at
          ),
          shared_by:profiles!shared_by_user_id(
            full_name,
            avatar_url
          )
        `)
        .eq('shared_with_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSharedDocuments((data as any) || []);
      */
    } catch (error) {
      console.error('Erro ao carregar documentos compartilhados:', error);
      toast.error('Erro ao carregar documentos compartilhados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = (doc: SharedDocument['document']) => {
    const blob = new Blob([doc.formatted_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
  };

  const handleRemoveShare = async (shareId: string) => {
    const { error } = await supabase
      .from('shared_documents')
      .delete()
      .eq('id', shareId);

    if (error) {
      console.error('Erro ao remover compartilhamento:', error);
      toast.error('Erro ao remover compartilhamento');
      return;
    }

    toast.success('Compartilhamento removido!');
    loadSharedDocuments();
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      
      if (data && data.length > 0) {
        setSelectedTemplateId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    }
  };

  const handleReviewWithCopilot = (doc: SharedDocument['document']) => {
    setSelectedDocument(doc);
    setCopilotResult(null);
    setShowReviewDialog(true);
  };

  const handleProcessDocument = async () => {
    if (!selectedDocument || !selectedTemplateId) {
      toast.error('Selecione um template');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.loading("📄 Processando documento com IA...", { id: "processing" });
      
      const result = await formatarComCopilot(selectedDocument.formatted_text, selectedTemplateId);
      
      toast.dismiss("processing");
      
      if (result.alertas && result.alertas.length > 0) {
        toast.warning(`⚠️ ${result.alertas.length} alertas encontrados`);
      }
      
      if (result.sugestoes && result.sugestoes.length > 0) {
        toast.info(`💡 ${result.sugestoes.length} sugestões de formatação`);
      }
      
      setCopilotResult(result);
      toast.success("✅ Documento revisado com sucesso!");
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast.error("❌ Erro ao processar documento");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Compartilhado Comigo
        </h1>
        <p className="text-muted-foreground mt-1">
          Documentos que outras pessoas compartilharam com você
        </p>
      </div>

      {/* Lista de documentos compartilhados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Documentos Recebidos</CardTitle>
          <CardDescription>
            {sharedDocuments.length} documento(s) compartilhado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharedDocuments.length === 0 ? (
            <div className="text-center py-16">
              <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                Nenhum documento compartilhado ainda
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Quando alguém compartilhar um documento com você, ele aparecerá aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedDocuments.map((share) => (
                <div
                  key={share.id}
                  className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar do usuário que compartilhou */}
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={share.shared_by.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {share.shared_by.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Informações do documento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className="font-semibold truncate">{share.document.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          Compartilhado por{' '}
                          <span className="font-medium text-foreground">
                            {share.shared_by.full_name}
                          </span>
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="secondary" className="text-xs">
                          {share.document.template_name}
                        </Badge>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(share.created_at), "dd 'de' MMMM, yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReviewWithCopilot(share.document)}
                      title="Revisar com Copilot"
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadDocument(share.document)}
                      title="Baixar documento"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveShare(share.id)}
                      title="Remover da lista"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Revisão com Copilot */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Revisar Documento com Copilot
            </DialogTitle>
            <DialogDescription>
              Selecione um template e processe o documento para obter sugestões e alertas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Seleção de Template */}
            <div className="space-y-2">
              <Label htmlFor="template">Template de Formatação</Label>
              <div className="flex gap-2">
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Escolha um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleProcessDocument}
                  disabled={isProcessing || !selectedTemplateId}
                  className="min-w-[150px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Processar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview do Documento */}
            <div className="space-y-2">
              <Label>Documento Original</Label>
              <Textarea
                value={selectedDocument?.formatted_text || ''}
                readOnly
                rows={10}
                className="font-mono text-sm resize-none"
              />
            </div>

            {/* Resultados do Copilot */}
            {copilotResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Label>Texto Formatado</Label>
                  <Textarea
                    value={copilotResult.textoFormatado}
                    readOnly
                    rows={15}
                    className="font-mono text-sm resize-none mt-2"
                  />
                </div>
                <div className="lg:col-span-1">
                  <CopilotPanel
                    sugestoes={copilotResult.sugestoes}
                    alertas={copilotResult.alertas}
                    documentoOriginal={selectedDocument?.formatted_text || ''}
                    documentoFormatado={copilotResult.textoFormatado}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compartilhado;
