import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SaveDocumentDialog } from './SaveDocumentDialog';

interface DocumentPreviewProps {
  originalText: string;
  formattedText: string;
  templateName?: string;
  alertsCount?: number;
  suggestionsCount?: number;
}

const DocumentPreview = ({ 
  originalText, 
  formattedText,
  templateName = '',
  alertsCount = 0,
  suggestionsCount = 0,
}: DocumentPreviewProps) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Texto copiado', {
        description: 'O texto foi copiado para a área de transferência'
      });
    } catch (error) {
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o texto'
      });
    }
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Download iniciado', {
      description: `Arquivo ${filename} está sendo baixado`
    });
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/10">
        <CardTitle className="flex items-center justify-between">
          <span>Visualização do Documento</span>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(formattedText)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleDownload(formattedText, 'relatorio-formatado.txt')}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="formatted" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="formatted" className="flex-1">
                Documento Formatado
              </TabsTrigger>
              <TabsTrigger value="original" className="flex-1">
                Documento Original
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex-1">
                Comparação
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="formatted" className="m-0">
            <ScrollArea className="h-[600px]">
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {formattedText}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="original" className="m-0">
            <ScrollArea className="h-[600px]">
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                    {originalText}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comparison" className="m-0">
            <ScrollArea className="h-[600px]">
              <div className="p-6 grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Documento Original</h4>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
                      {originalText.substring(0, 1500)}
                      {originalText.length > 1500 && '\n\n[...continuação do documento...]'}
                    </pre>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/30">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <h4 className="font-semibold text-sm text-primary">Documento Formatado ✓</h4>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
                      {formattedText.substring(0, 1500)}
                      {formattedText.length > 1500 && '\n\n[...continuação do documento...]'}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      <SaveDocumentDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        documentData={{
          originalText,
          formattedText,
          templateName,
          alertsCount,
          suggestionsCount,
        }}
      />
    </Card>
  );
};

export default DocumentPreview;
