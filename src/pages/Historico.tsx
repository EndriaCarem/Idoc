import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, CheckCircle, AlertCircle, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProcessedDocument {
  id: string;
  template_name: string;
  original_filename: string;
  processed_at: string;
  alerts_count: number;
  suggestions_count: number;
  document_group_id: string;
  version_number: number;
  original_text: string;
  formatted_text: string;
}

interface DocumentGroup {
  group_id: string;
  filename: string;
  versions: ProcessedDocument[];
  latest_version: ProcessedDocument;
}

const Historico = () => {
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('processed_documents')
        .select('*')
        .order('processed_at', { ascending: false });

      if (error) throw error;
      
      const documents = (data as ProcessedDocument[]) || [];
      
      // Agrupar documentos por document_group_id
      const groupsMap = new Map<string, DocumentGroup>();
      
      documents.forEach(doc => {
        if (!doc.document_group_id) return;
        
        if (!groupsMap.has(doc.document_group_id)) {
          groupsMap.set(doc.document_group_id, {
            group_id: doc.document_group_id,
            filename: doc.original_filename,
            versions: [],
            latest_version: doc
          });
        }
        
        const group = groupsMap.get(doc.document_group_id)!;
        group.versions.push(doc);
        
        // Atualizar latest_version se esta versão for mais recente
        if (new Date(doc.processed_at) > new Date(group.latest_version.processed_at)) {
          group.latest_version = doc;
        }
      });
      
      // Ordenar versões dentro de cada grupo
      groupsMap.forEach(group => {
        group.versions.sort((a, b) => b.version_number - a.version_number);
      });
      
      setDocumentGroups(Array.from(groupsMap.values()));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de documentos');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleRestoreVersion = async (doc: ProcessedDocument) => {
    const dataToStore = {
      type: 'file',
      content: doc.original_text,
      filename: doc.original_filename,
      document_group_id: doc.document_group_id
    };
    sessionStorage.setItem('copilot_doc', JSON.stringify(dataToStore));
    window.location.href = '/';
  };

  const confirmDeleteVersion = async () => {
    if (!deleteVersionId) return;
    
    try {
      const { error } = await supabase
        .from('processed_documents')
        .delete()
        .eq('id', deleteVersionId);

      if (error) throw error;
      
      toast.success('Versão excluída com sucesso!');
      setDeleteVersionId(null);
      loadDocuments();
    } catch (error) {
      console.error('Erro ao excluir versão:', error);
      toast.error('Erro ao excluir versão');
    }
  };

  const downloadDocument = async (doc: ProcessedDocument) => {
    try {
      const blob = new Blob([doc.formatted_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.original_filename.replace(/\.[^/.]+$/, '')}_v${doc.version_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
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
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Histórico de Documentos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Visualize todos os documentos processados</p>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {documentGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground text-center px-4">Nenhum documento processado ainda</p>
            </CardContent>
          </Card>
        ) : (
          documentGroups.map((group) => (
            <Card key={group.group_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 w-full">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 break-words">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="break-all">{group.filename}</span>
                      {group.versions.length > 1 && (
                        <Badge variant="secondary" className="ml-2">
                          {group.versions.length} versões
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="break-words">
                        Última versão: {format(new Date(group.latest_version.processed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRestoreVersion(group.latest_version)}
                      className="flex-1 sm:flex-initial"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Mover
                    </Button>
                    {group.versions.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleGroup(group.group_id)}
                        className="flex-1 sm:flex-initial"
                      >
                        {expandedGroups.has(group.group_id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {group.latest_version.template_name}
                  </Badge>
                  {group.latest_version.suggestions_count > 0 && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      {group.latest_version.suggestions_count} sugestões
                    </Badge>
                  )}
                  {group.latest_version.alerts_count > 0 && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {group.latest_version.alerts_count} alertas
                    </Badge>
                  )}
                </div>
                
                {/* Versões anteriores */}
                {expandedGroups.has(group.group_id) && group.versions.length > 1 && (
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Versões anteriores:</p>
                    {group.versions.slice(1).map((version) => (
                      <div key={version.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Versão {version.version_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(version.processed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                              title="Mover para área de processamento"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadDocument(version)}
                              title="Baixar versão"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteVersionId(version.id)}
                              className="text-destructive hover:text-destructive"
                              title="Apagar versão"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {version.template_name}
                          </Badge>
                          {version.suggestions_count > 0 && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              {version.suggestions_count}
                            </Badge>
                          )}
                          {version.alerts_count > 0 && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              {version.alerts_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de confirmação para apagar versão */}
      <AlertDialog open={!!deleteVersionId} onOpenChange={() => setDeleteVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar esta versão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVersion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Historico;
