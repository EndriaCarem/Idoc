import { AlertCircle, CheckCircle, MessageSquare, Sparkles, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CopilotPanelProps {
  sugestoes: string[];
  alertas: string[];
  documentoOriginal: string;
  documentoFormatado: string;
}

const CopilotPanel = ({ 
  sugestoes, 
  alertas,
  documentoOriginal,
  documentoFormatado 
}: CopilotPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-copilot', {
        body: {
          messages: [...messages, userMessage],
          documentoOriginal,
          documentoFormatado,
          sugestoes,
          alertas
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro no chat:', error);
      toast({
        title: "Erro no chat",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sticky top-24">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Copilot</CardTitle>
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

              {/* Chat IA Interativo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Assistente Interativo</h4>
                </div>
                
                {messages.length === 0 ? (
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-secondary/5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      💬 Pergunte ao Copiloto Técnico:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-2 pl-1">
                      <li className="flex gap-2"><span className="text-primary">•</span> "Como melhorar a seção de objetivos para atender aos requisitos?"</li>
                      <li className="flex gap-2"><span className="text-secondary">•</span> "Este parágrafo sobre investimentos está conforme?"</li>
                      <li className="flex gap-2"><span className="text-primary">•</span> "Revisar a nomenclatura técnica da seção de metodologia"</li>
                      <li className="flex gap-2"><span className="text-secondary">•</span> "Quais documentos comprobatórios devo anexar?"</li>
                      <li className="flex gap-2"><span className="text-primary">•</span> "Sugestões para tabela de investimentos em P&D"</li>
                    </ul>
                    <p className="text-xs text-muted-foreground italic pt-2 border-t">
                      💡 Dica: Copie e cole trechos específicos do documento para análise detalhada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-primary/10 ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <p className="font-semibold text-xs mb-1">
                          {msg.role === "user" ? "Você" : "Copiloto"}
                        </p>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua pergunta..."
                    className="min-h-[60px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-[60px] w-12 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
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
