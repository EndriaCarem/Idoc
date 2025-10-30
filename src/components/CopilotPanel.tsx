import { AlertCircle, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CopilotPanelProps {
  sugestoes: string[];
  alertas: string[];
}

const CopilotPanel = ({ sugestoes, alertas }: CopilotPanelProps) => {
  return (
    <div className="space-y-4 sticky top-24">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Assistente IA</CardTitle>
          </div>
          <CardDescription>
            Análise e sugestões do copiloto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-6">
              {/* Alertas */}
              {alertas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <h4 className="font-semibold text-sm">Alertas de Conformidade</h4>
                    <Badge variant="destructive" className="ml-auto">
                      {alertas.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {alertas.map((alerta, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                      >
                        <p className="text-sm">{alerta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Sugestões */}
              {sugestoes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary" />
                    <h4 className="font-semibold text-sm">Formatações Aplicadas</h4>
                    <Badge variant="secondary" className="ml-auto">
                      {sugestoes.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {sugestoes.map((sugestao, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-secondary/5 border border-secondary/20 flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{sugestao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Chat IA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Chat com IA</h4>
                </div>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground italic">
                    Funcionalidade de chat interativo em desenvolvimento...
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CopilotPanel;
