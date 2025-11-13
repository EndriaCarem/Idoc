import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Gap {
  secao: string;
  campo: string;
  descricao: string;
  exemplo: string;
  obrigatorio: boolean;
}

interface DocumentGapsPanelProps {
  gaps: Gap[];
  percentualCompleto: number;
  isLoading?: boolean;
  documentoOriginal: string;
  documentoFormatado: string;
  templateContent?: string;
  documentId?: string;
  onDocumentUpdate?: (newContent: string) => void;
}

const DocumentGapsPanel = ({ 
  gaps, 
  percentualCompleto, 
  isLoading,
  documentoOriginal,
  documentoFormatado,
  templateContent,
  documentId,
  onDocumentUpdate
}: DocumentGapsPanelProps) => {
  const [gapsOpen, setGapsOpen] = useState(true);
  const gapsObrigatorios = gaps.filter(g => g.obrigatorio);
  const gapsOpcionais = gaps.filter(g => !g.obrigatorio);
  const { toast } = useToast();
  const [processingGapIndex, setProcessingGapIndex] = useState<number | null>(null);

  const handleAcceptSuggestion = async (gap: Gap, index: number) => {
    setProcessingGapIndex(index);
    
    try {
      const promptMessage = `Por favor, preencha o seguinte campo do documento:

Seção: ${gap.secao}
Campo: ${gap.campo}
Descrição: ${gap.descricao}
${gap.exemplo ? `Exemplo: ${gap.exemplo}` : ''}

Analise o documento atual e preencha este campo de forma apropriada, seguindo fielmente o template e mantendo a conformidade técnica. Retorne o documento completo atualizado.`;

      const { data, error } = await supabase.functions.invoke('chat-copilot', {
        body: {
          messages: [{ role: "user", content: promptMessage }],
          documentoOriginal,
          documentoFormatado,
          templateContent,
          documentId
        }
      });

      if (error) throw error;

      if (data.type === 'update_document' && data.updates?.documentoAtualizado) {
        if (onDocumentUpdate) {
          onDocumentUpdate(data.updates.documentoAtualizado);
          toast({
            title: "Campo preenchido!",
            description: `O campo "${gap.campo}" foi preenchido automaticamente.`,
          });
        }
      } else {
        toast({
          title: "Aviso",
          description: "A IA não conseguiu gerar uma atualização automática. Tente usar o chat para mais detalhes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao processar sugestão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a sugestão. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessingGapIndex(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-600 animate-pulse" />
            <CardTitle>Analisando Documento...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-600" />
          <CardTitle>Análise de Completude</CardTitle>
        </div>
        <CardDescription>
          Informações pendentes para conformidade total
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Documento Completo</span>
            <span className="text-muted-foreground">{percentualCompleto}%</span>
          </div>
          <Progress value={percentualCompleto} className="h-3" />
          {percentualCompleto === 100 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Todos os campos obrigatórios preenchidos!</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {gaps.length} campo{gaps.length !== 1 ? 's' : ''} pendente{gaps.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {gaps.length > 0 && (
          <>
            <Separator />

            <Collapsible open={gapsOpen} onOpenChange={setGapsOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold text-sm">Informações Pendentes</h4>
                  <Badge variant="secondary" className="ml-auto">
                    {gaps.length}
                  </Badge>
                  <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${gapsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <ScrollArea className="h-[400px] mt-4">
                  <div className="space-y-4 pr-4">
                    {/* Gaps Obrigatórios */}
                    {gapsObrigatorios.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-destructive uppercase tracking-wide">
                          ⚠️ Obrigatórios ({gapsObrigatorios.length})
                        </h5>
                        {gapsObrigatorios.map((gap, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-destructive/5 border-l-4 border-destructive space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {gap.secao}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">
                                  Campo: {gap.campo}
                                </p>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                Obrigatório
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {gap.descricao}
                            </p>
                            {gap.exemplo && (
                              <div className="mt-2 p-2 rounded bg-muted/50 border">
                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                  Exemplo:
                                </p>
                                <p className="text-xs font-mono">{gap.exemplo}</p>
                              </div>
                            )}
                            <div className="pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(gap, index)}
                                disabled={processingGapIndex === index}
                                className="text-xs"
                              >
                                {processingGapIndex === index ? "Processando..." : "Aceitar e Preencher"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Gaps Opcionais */}
                    {gapsOpcionais.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                          💡 Recomendados ({gapsOpcionais.length})
                        </h5>
                        {gapsOpcionais.map((gap, index) => {
                          const globalIndex = gapsObrigatorios.length + index;
                          return (
                            <div
                              key={index}
                              className="p-4 rounded-lg bg-amber-500/5 border-l-4 border-amber-500 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {gap.secao}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-medium">
                                    Campo: {gap.campo}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Opcional
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {gap.descricao}
                              </p>
                              {gap.exemplo && (
                                <div className="mt-2 p-2 rounded bg-muted/50 border">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">
                                    Exemplo:
                                  </p>
                                  <p className="text-xs font-mono">{gap.exemplo}</p>
                                </div>
                              )}
                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleAcceptSuggestion(gap, globalIndex)}
                                  disabled={processingGapIndex === globalIndex}
                                  className="text-xs"
                                >
                                  {processingGapIndex === globalIndex ? "Processando..." : "Aceitar e Preencher"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        💬 <strong>Dica:</strong> Clique em "Aceitar e Preencher" para que a IA preencha automaticamente o campo, ou use o chat do Copilot para fornecer informações específicas.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentGapsPanel;