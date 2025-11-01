import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FolderPlus, File, Folder, Share2, Trash2, Download, Edit, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedDocument {
  id: string;
  name: string;
  formatted_text: string;
  template_name: string;
  created_at: string;
  folder_id: string | null;
}

interface FolderType {
  id: string;
  name: string;
  created_at: string;
}

const Arquivos = () => {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedFolder]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadFolders(), loadDocuments()]);
    setLoading(false);
  };

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .is('parent_folder_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pastas:', error);
      toast.error('Erro ao carregar pastas');
      return;
    }

    setFolders(data || []);
  };

  const loadDocuments = async () => {
    let query = supabase
      .from('saved_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedFolder) {
      query = query.eq('folder_id', selectedFolder);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
      return;
    }

    setDocuments(data || []);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Digite um nome para a pasta');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    const { error } = await supabase
      .from('folders')
      .insert({
        name: newFolderName.trim(),
        user_id: user.id,
      });

    if (error) {
      console.error('Erro ao criar pasta:', error);
      toast.error('Erro ao criar pasta');
      return;
    }

    toast.success('Pasta criada com sucesso!');
    setNewFolderName('');
    setShowNewFolderDialog(false);
    loadFolders();
  };

  const handleDeleteDocument = async (docId: string) => {
    const { error } = await supabase
      .from('saved_documents')
      .delete()
      .eq('id', docId);

    if (error) {
      console.error('Erro ao excluir documento:', error);
      toast.error('Erro ao excluir documento');
      return;
    }

    toast.success('Documento excluído!');
    loadDocuments();
  };

  const handleShareDocument = async () => {
    if (!shareEmail.trim() || !selectedDocId) {
      toast.error('Digite um email válido');
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('full_name', `%${shareEmail}%`)
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      toast.error('Usuário não encontrado');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('shared_documents')
      .insert({
        document_id: selectedDocId,
        shared_by_user_id: user.id,
        shared_with_user_id: profiles[0].user_id,
        permission: 'view',
      });

    if (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar documento');
      return;
    }

    toast.success('Documento compartilhado com sucesso!');
    setShowShareDialog(false);
    setShareEmail('');
    setSelectedDocId(null);
  };

  const handleDownloadDocument = (doc: SavedDocument) => {
    const blob = new Blob([doc.formatted_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
  };

  const currentFolderName = selectedFolder 
    ? folders.find(f => f.id === selectedFolder)?.name 
    : null;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus Arquivos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus documentos formatados</p>
        </div>
        <Button onClick={() => setShowNewFolderDialog(true)} className="w-full sm:w-auto">
          <FolderPlus className="mr-2 h-4 w-4" />
          Nova Pasta
        </Button>
      </div>

      {/* Breadcrumb */}
      {currentFolderName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button 
            onClick={() => setSelectedFolder(null)}
            className="hover:text-foreground transition-colors"
          >
            Todos os Arquivos
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{currentFolderName}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Pastas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Pastas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {/* Todos os Arquivos */}
              <button
                onClick={() => setSelectedFolder(null)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition-all
                  flex items-center gap-3 group
                  ${selectedFolder === null
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-accent'
                  }
                `}
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium text-sm">Todos os Arquivos</span>
              </button>

              {/* Lista de Pastas */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg transition-all
                    flex items-center gap-3 group
                    ${selectedFolder === folder.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent'
                    }
                  `}
                >
                  <Folder className="h-4 w-4" />
                  <span className="font-medium text-sm truncate">{folder.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Documentos */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">
                    {currentFolderName || 'Todos os Documentos'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {documents.length} documento(s) encontrado(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-16">
                  <File className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">Nenhum documento nesta pasta</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comece processando um documento na página inicial
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {doc.template_name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setShowShareDialog(true);
                          }}
                          title="Compartilhar"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Excluir"
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
      </div>

      {/* Dialog Nova Pasta */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Pasta</DialogTitle>
            <DialogDescription>
              Digite um nome para organizar seus documentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Relatórios 2024"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>Criar Pasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Compartilhar */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Documento</DialogTitle>
            <DialogDescription>
              Digite o nome ou email do usuário para compartilhar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Nome ou Email</Label>
              <Input
                id="share-email"
                placeholder="Digite o nome ou email do usuário"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShareDocument()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleShareDocument}>Compartilhar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Arquivos;
