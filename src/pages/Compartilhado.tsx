import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Download, Trash2, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const Compartilhado = () => {
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSharedDocuments();
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

  const handleReviewWithCopilot = (doc: SharedDocument['document']) => {
    // Armazenar o documento no sessionStorage para ser processado na página principal
    sessionStorage.setItem('documentToReview', JSON.stringify({
      text: doc.formatted_text,
      name: doc.name
    }));
    
    toast.success('Redirecionando para o Copilot...');
    navigate('/');
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
    </div>
  );
};

export default Compartilhado;
