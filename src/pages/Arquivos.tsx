import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, File, Folder, Share2, Trash2, Download, Upload, Edit, Bold, Italic, Underline, List, ListOrdered, Undo, Redo, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<SavedDocument | null>(null);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    loadFolders();
    loadDocuments();
  }, [selectedFolder]);

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

  const handleEditDocument = (doc: SavedDocument) => {
    setEditingDocument(doc);
    setEditedText(doc.formatted_text);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDocument) return;

    const { error } = await supabase
      .from('saved_documents')
      .update({ formatted_text: editedText })
      .eq('id', editingDocument.id);

    if (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento');
      return;
    }

    toast.success('Documento salvo com sucesso!');
    setShowEditDialog(false);
    setEditingDocument(null);
    loadDocuments();
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('edit-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedText.substring(start, end);
    const newText = editedText.substring(0, start) + before + selectedText + after + editedText.substring(end);
    
    setEditedText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meus Arquivos</h1>
          <p className="text-muted-foreground">Gerencie seus documentos formatados</p>
        </div>
        <Button onClick={() => setShowNewFolderDialog(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Nova Pasta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com pastas estilo gaveta */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-background to-accent/5 border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder className="h-4 w-4 text-primary" />
                  Pastas
                </CardTitle>
                {selectedFolder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFolder(null)}
                    className="text-xs gap-1 h-7"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Voltar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2 max-h-[600px] overflow-y-auto overflow-x-visible pr-2">
                  {/* Pasta "Todos os arquivos" */}
                  <button
                    className={`
                      w-full text-left p-3 rounded-lg
                      transition-all duration-300 ease-out
                      flex items-center gap-3
                      ${selectedFolder === null 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02]' 
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                      }
                    `}
                    onClick={() => setSelectedFolder(null)}
                  >
                    <Folder 
                      className={`h-4 w-4 transition-transform duration-300 ${
                        selectedFolder === null ? 'scale-110' : ''
                      }`}
                    />
                    <span className="font-medium text-sm">Todos os Arquivos</span>
                  </button>

                  {/* Pastas do usuário */}
                  {folders.map((folder, index) => {
                    const colors = [
                      { from: 'from-purple-500', to: 'to-purple-600', text: 'text-white' },
                      { from: 'from-pink-500', to: 'to-pink-600', text: 'text-white' },
                      { from: 'from-green-500', to: 'to-green-600', text: 'text-white' },
                      { from: 'from-orange-500', to: 'to-orange-600', text: 'text-white' },
                      { from: 'from-red-500', to: 'to-red-600', text: 'text-white' },
                      { from: 'from-indigo-500', to: 'to-indigo-600', text: 'text-white' },
                    ];
                    const color = colors[index % colors.length];
                    const isSelected = selectedFolder === folder.id;

                    return (
                      <button
                        key={folder.id}
                        className={`
                          w-full text-left p-3 rounded-lg
                          transition-all duration-300 ease-out
                          flex items-center gap-3
                          bg-gradient-to-r ${color.from} ${color.to} ${color.text}
                          ${isSelected ? 'shadow-lg scale-[1.02]' : 'opacity-90 hover:opacity-100'}
                        `}
                        onClick={() => setSelectedFolder(folder.id)}
                      >
                        <Folder 
                          className={`h-4 w-4 transition-transform duration-300 ${
                            isSelected ? 'scale-110' : ''
                          }`}
                        />
                        <span className="font-medium text-sm truncate">{folder.name}</span>
                      </button>
                    );
                  })}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload e lista de documentos */}
        <div className="lg:col-span-3 space-y-6">
          {/* Área de upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed rounded-xl p-12 text-center transition-all hover:border-primary/50">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2">
                  Arraste seu documento aqui
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique para selecionar
                </p>
                <input
                  type="file"
                  accept=".txt,.docx,.pdf"
                  className="hidden"
                  id="file-upload-arquivos"
                />
                <label htmlFor="file-upload-arquivos">
                  <Button asChild>
                    <span className="text-primary-foreground">Selecionar Arquivo</span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Formatos suportados: TXT, DOCX, PDF
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {selectedFolder 
                  ? folders.find(f => f.id === selectedFolder)?.name 
                  : 'Todos os Documentos'}
              </CardTitle>
              <CardDescription className="text-base">
                {documents.length} documento(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum documento nesta pasta</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <File className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.template_name} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDocument(doc)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para criar nova pasta */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Pasta</DialogTitle>
            <DialogDescription>
              Digite um nome para a nova pasta
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

      {/* Dialog para compartilhar documento */}
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

      {/* Dialog para editar documento */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Documento: {editingDocument?.name}</DialogTitle>
            <DialogDescription>
              Use a barra de ferramentas para formatar o texto
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de ferramentas de formatação */}
          <div className="flex flex-wrap gap-1 p-3 bg-muted/50 rounded-lg border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('**', '**')}
              title="Negrito"
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('_', '_')}
              title="Itálico"
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('<u>', '</u>')}
              title="Sublinhado"
              className="h-8 w-8 p-0"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <div className="w-px h-8 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('• ', '')}
              title="Lista com marcadores"
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('1. ', '')}
              title="Lista numerada"
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Editor de texto */}
          <div className="space-y-4 py-2">
            <textarea
              id="edit-textarea"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-[400px] p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="Digite ou edite o texto aqui..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Arquivos;
