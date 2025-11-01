import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Trash2, Users, Sparkles, Loader2, MoreVertical, Save, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarComCopilot } from '@/services/geminiService';
import type { CopilotResult } from '@/types';
import CopilotPanel from '@/components/CopilotPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { SaveDocumentDialog } from '@/components/SaveDocumentDialog';

interface SharedDocument {
  id: string;
  document_id: string;
  shared_by_user_id: string;
  created_at: string;
  tag_name?: string;
  tag_emoji?: string;
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
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument['document'] | null>(null);
  const [selectedShare, setSelectedShare] = useState<SharedDocument | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copilotResult, setCopilotResult] = useState<CopilotResult | null>(null);
  const isMobile = useIsMobile();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadSharedDocuments();
    loadTemplates();
  }, []);

  const loadSharedDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Dados fictícios para demonstração com nomes variados
      const randomNames = [
        { name: 'Mauricio Gomes', avatar: 'https://i.pravatar.cc/150?img=12' },
        { name: 'Ana Paula Costa', avatar: 'https://i.pravatar.cc/150?img=47' },
        { name: 'Roberto Mendes', avatar: 'https://i.pravatar.cc/150?img=33' },
        { name: 'Mariana Santos', avatar: 'https://i.pravatar.cc/150?img=25' },
        { name: 'João Pedro Oliveira', avatar: 'https://i.pravatar.cc/150?img=68' },
      ];

      // Usar o primeiro nome (Mauricio Gomes) para o primeiro documento
      const randomPerson2 = randomNames[Math.floor(Math.random() * randomNames.length)];

      const mockData: SharedDocument[] = [
        {
          id: 'mock-1',
          document_id: 'doc-1',
          shared_by_user_id: 'user-1',
          created_at: new Date().toISOString(),
          tag_emoji: '📄',
          tag_name: 'relatório',
          document: {
            id: 'doc-1',
            name: 'Contrato de Prestação de Serviços - Revisado',
            formatted_text: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: Tech Solutions Ltda.
CNPJ: 12.345.678/0001-90
Endereço: Av. Paulista, 1000 - São Paulo/SP

CONTRATADO: João Silva Consultoria
CPF: 123.456.789-00
Endereço: Rua das Flores, 500 - São Paulo/SP

OBJETO: Prestação de serviços de consultoria em tecnologia da informação.

PRAZO: 12 (doze) meses, a partir de 01/01/2024.

VALOR: R$ 10.000,00 (dez mil reais) mensais.

CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de consultoria especializada em desenvolvimento de software e infraestrutura de TI.

CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DO CONTRATADO
São obrigações do CONTRATADO:
a) Prestar os serviços com qualidade e pontualidade;
b) Manter sigilo sobre informações confidenciais;
c) Apresentar relatórios mensais de atividades.

CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DO CONTRATANTE
São obrigações do CONTRATANTE:
a) Efetuar os pagamentos nas datas acordadas;
b) Fornecer as informações necessárias para execução dos serviços;
c) Disponibilizar ambiente adequado de trabalho.

São Paulo, 15 de março de 2024.

_____________________          _____________________
CONTRATANTE                    CONTRATADO`,
            template_name: 'Mover',
            created_at: new Date().toISOString(),
          },
          shared_by: {
            full_name: randomNames[0].name,
            avatar_url: randomNames[0].avatar,
          },
        },
        {
          id: 'mock-2',
          document_id: 'doc-2',
          shared_by_user_id: 'user-2',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          tag_emoji: '📊',
          tag_name: 'Relatório',
          document: {
            id: 'doc-2',
            name: 'Relatório de Análise Técnica Q1 2024',
            formatted_text: `RELATÓRIO DE ANÁLISE TÉCNICA - 1º TRIMESTRE 2024

Empresa: Tech Innovations S.A.
Período: Janeiro a Março de 2024
Responsável: Ana Paula Costa

1. RESUMO EXECUTIVO
Este relatório apresenta a análise técnica dos projetos desenvolvidos durante o primeiro trimestre de 2024, incluindo métricas de desempenho, recursos utilizados e principais conquistas.

2. PROJETOS DESENVOLVIDOS
2.1 Sistema de Gestão Integrada
- Status: 85% concluído
- Prazo estimado: Abril/2024
- Recursos alocados: 5 desenvolvedores
- Budget: R$ 250.000,00

2.2 Aplicativo Mobile - Versão 2.0
- Status: Finalizado
- Lançamento: Março/2024
- Downloads: 15.000 nos primeiros 10 dias
- Avaliação: 4.5 estrelas

3. MÉTRICAS DE DESEMPENHO
- Taxa de conclusão de tarefas: 92%
- Bugs identificados: 47
- Bugs corrigidos: 45
- Tempo médio de resposta: 2.3 horas

4. RECURSOS HUMANOS
- Equipe técnica: 12 profissionais
- Novos colaboradores: 2
- Taxa de satisfação interna: 87%

5. INVESTIMENTOS
Total investido: R$ 500.000,00
Distribuição:
- Infraestrutura: 40%
- Recursos Humanos: 45%
- Ferramentas e Licenças: 15%

6. CONCLUSÕES
O primeiro trimestre apresentou resultados positivos com entrega dentro do prazo e qualidade acima da média. Recomenda-se manter o ritmo de desenvolvimento e ampliar a equipe em 20% para o próximo trimestre.

Data: 31 de março de 2024
Assinatura: Ana Paula Costa`,
            template_name: 'RA',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          shared_by: {
            full_name: randomPerson2.name,
            avatar_url: randomPerson2.avatar,
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
    // Garantir que o texto do documento seja carregado na área de edição
    setEditableText(doc.formatted_text || '');
    setCopilotResult(null);
    setShowReviewDialog(true);
    console.log('Documento carregado:', doc.name, 'Tamanho do texto:', doc.formatted_text?.length);
  };

  const handleProcessDocument = async () => {
    if (!editableText || !selectedTemplateId) {
      toast.error('Selecione um template e verifique se há texto');
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.loading("📄 Processando documento com IA...", { id: "processing" });
      
      const result = await formatarComCopilot(editableText, selectedTemplateId);
      
      toast.dismiss("processing");
      
      if (result.alertas && result.alertas.length > 0) {
        toast.warning(`⚠️ ${result.alertas.length} alertas encontrados`);
      }
      
      if (result.sugestoes && result.sugestoes.length > 0) {
        toast.info(`💡 ${result.sugestoes.length} sugestões de formatação`);
      }
      
      setCopilotResult(result);
      // Atualizar o texto editável com o resultado formatado
      setEditableText(result.textoFormatado);
      toast.success("✅ Documento revisado com sucesso!");
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast.error("❌ Erro ao processar documento");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      toast.success('Texto copiado', {
        description: 'O texto foi copiado para a área de transferência'
      });
    } catch (error) {
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o texto'
      });
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([editableText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDocument?.name || 'documento'}-editado.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Download iniciado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-safe">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Compartilhado Comigo
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Documentos que outras pessoas compartilharam com você
        </p>
      </div>

      {/* Lista de documentos compartilhados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Documentos Recebidos</CardTitle>
          <CardDescription className="text-sm">
            {sharedDocuments.length} documento(s) compartilhado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sharedDocuments.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <Users className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg">
                Nenhum documento compartilhado ainda
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Quando alguém compartilhar um documento com você, ele aparecerá aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedDocuments.map((share) => (
                <div
                  key={share.id}
                  className="group flex items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-all active:bg-accent touch-manipulation"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Avatar do usuário que compartilhou */}
                    <Avatar className="h-10 w-10 sm:h-10 sm:w-10 border-2 border-primary/20 flex-shrink-0 mt-1 sm:mt-0">
                      <AvatarImage src={share.shared_by.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {share.shared_by.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Informações do documento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold truncate text-sm sm:text-base">{share.document.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                        <p className="text-muted-foreground">
                          Compartilhado por{' '}
                          <span className="font-medium text-foreground">
                            {share.shared_by.full_name}
                          </span>
                        </p>
                        <span className="text-muted-foreground hidden sm:inline">•</span>
                        <Badge variant="secondary" className="text-xs">
                          {share.document.template_name}
                        </Badge>
                        {share.tag_name && share.tag_emoji && (
                          <>
                            <span className="text-muted-foreground hidden sm:inline">•</span>
                            <Badge variant="outline" className="text-xs">
                              {share.tag_emoji} {share.tag_name}
                            </Badge>
                          </>
                        )}
                        <span className="text-muted-foreground hidden sm:inline">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(share.created_at), "dd 'de' MMMM, yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações - Desktop: mostrar todos os botões, Mobile: botão de menu */}
                  {isMobile ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-9 w-9"
                      onClick={() => {
                        setSelectedShare(share);
                        setShowActionsSheet(true);
                      }}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Sheet para ações no mobile */}
      <Sheet open={showActionsSheet} onOpenChange={setShowActionsSheet}>
        <SheetContent side="bottom" className="bg-background">
          <SheetHeader>
            <SheetTitle className="text-left">Ações do Documento</SheetTitle>
            <SheetDescription className="text-left">
              {selectedShare?.document.name}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => {
                if (selectedShare) {
                  handleReviewWithCopilot(selectedShare.document);
                  setShowActionsSheet(false);
                }
              }}
            >
              <Sparkles className="mr-3 h-5 w-5 text-primary" />
              Revisar com Copilot
            </Button>
            <Button
              variant="outline"
              className="justify-start h-12"
              onClick={() => {
                if (selectedShare) {
                  handleDownloadDocument(selectedShare.document);
                  setShowActionsSheet(false);
                }
              }}
            >
              <Download className="mr-3 h-5 w-5" />
              Baixar Documento
            </Button>
            <Button
              variant="outline"
              className="justify-start h-12 text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (selectedShare) {
                  handleRemoveShare(selectedShare.id);
                  setShowActionsSheet(false);
                }
              }}
            >
              <Trash2 className="mr-3 h-5 w-5" />
              Remover da Lista
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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

            {/* Área de Edição do Documento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Área de Edição</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    disabled={!editableText}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadText}
                    disabled={!editableText}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={!editableText}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Cópia
                  </Button>
                </div>
              </div>
              <Textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={15}
                className="font-mono text-sm resize-none"
                placeholder="O conteúdo do documento aparecerá aqui..."
              />
            </div>

            {/* Resultados do Copilot */}
            {copilotResult && (
              <div className="mt-4">
                <CopilotPanel
                  sugestoes={copilotResult.sugestoes}
                  alertas={copilotResult.alertas}
                  documentoOriginal={selectedDocument?.formatted_text || ''}
                  documentoFormatado={editableText}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Salvar Documento */}
      <SaveDocumentDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        documentData={{
          originalText: selectedDocument?.formatted_text || '',
          formattedText: editableText,
          templateName: templates.find(t => t.id === selectedTemplateId)?.name || '',
          alertsCount: copilotResult?.alertas.length || 0,
          suggestionsCount: copilotResult?.sugestoes.length || 0,
        }}
      />
    </div>
  );
};

export default Compartilhado;
