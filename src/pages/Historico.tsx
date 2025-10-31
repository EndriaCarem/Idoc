import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProcessedDocument {
  id: string;
  template_name: string;
  original_filename: string;
  processed_at: string;
  alerts_count: number;
  suggestions_count: number;
}

const Historico = () => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de documentos');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (docId: string) => {
    toast.info('Funcionalidade de download em desenvolvimento');
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Documentos</h1>
        <p className="text-muted-foreground mt-2">Visualize todos os documentos processados</p>
      </div>

      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum documento processado ainda</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {doc.original_filename}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(doc.processed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadDocument(doc.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {doc.template_name}
                  </Badge>
                  {doc.suggestions_count > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {doc.suggestions_count} sugestões
                    </Badge>
                  )}
                  {doc.alerts_count > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {doc.alerts_count} alertas
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Historico;
