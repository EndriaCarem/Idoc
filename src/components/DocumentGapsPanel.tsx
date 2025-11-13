import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
}

const DocumentGapsPanel = ({ gaps, percentualCompleto, isLoading }: DocumentGapsPanelProps) => {
  const [gapsOpen, setGapsOpen] = useState(true);
  const gapsObrigatorios = gaps.filter(g => g.obrigatorio);
  const gapsOpcionais = gaps.filter(g => !g.obrigatorio);

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
                        {gapsOpcionais.map((gap, index) => (
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
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        💬 <strong>Dica:</strong> Use o chat do Copilot abaixo para fornecer essas informações. 
                        O copilot irá perguntar se você deseja atualizar o documento automaticamente.
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
