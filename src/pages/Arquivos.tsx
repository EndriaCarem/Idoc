import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderPlus, File, Folder, Share2, Trash2, Download, Edit, FileText, ChevronRight, Upload, Tag, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COMMON_EMOJIS = ['📄', '📁', '📊', '📈', '📉', '📋', '📝', '📌', '📎', '🔖', '💼', '📦', '🗂️', '📑', '📃', '📜', '📰', '🗞️', '📚', '📖', '📕', '📗', '📘', '📙'];

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

interface UploadedFile {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  folder_id: string | null;
}

interface FileTag {
  id: string;
  name: string;
  emoji: string;
}

const Arquivos = () => {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [tags, setTags] = useState<FileTag[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('📄');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [selectedFolder]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadFolders(), loadDocuments(), loadUploadedFiles(), loadTags()]);
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

  const loadUploadedFiles = async () => {
    let query = supabase
      .from('uploaded_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedFolder) {
      query = query.eq('folder_id', selectedFolder);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos');
      return;
    }

    setUploadedFiles(data || []);
  };

  const loadTags = async () => {
    const { data, error } = await supabase
      .from('file_tags')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar etiquetas:', error);
      return;
    }

    setTags(data || []);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setShowUploadDialog(true);
    }
  };

  const handleUploadFile = async () => {
    if (!uploadingFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    try {
      toast.loading('Enviando arquivo...', { id: 'upload' });

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${uploadingFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, uploadingFile);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: user.id,
          name: uploadingFile.name,
          file_path: filePath,
          file_size: uploadingFile.size,
          file_type: uploadingFile.type,
          folder_id: selectedFolder,
        });

      if (dbError) throw dbError;

      toast.dismiss('upload');
      toast.success('Arquivo enviado com sucesso!');
      setShowUploadDialog(false);
      setUploadingFile(null);
      loadUploadedFiles();
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast.dismiss('upload');
      toast.error('Erro ao enviar arquivo');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Digite um nome para a etiqueta');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    const { error } = await supabase
      .from('file_tags')
      .insert({
        name: newTagName.trim(),
        emoji: newTagEmoji,
        user_id: user.id,
      });

    if (error) {
      console.error('Erro ao criar etiqueta:', error);
      toast.error('Erro ao criar etiqueta');
      return;
    }

    toast.success('Etiqueta criada com sucesso!');
    setNewTagName('');
    setNewTagEmoji('📄');
    setShowNewTagDialog(false);
    loadTags();
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .remove([filePath]);

    if (storageError) {
      console.error('Erro ao excluir arquivo do storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Erro ao excluir arquivo:', dbError);
      toast.error('Erro ao excluir arquivo');
      return;
    }

    toast.success('Arquivo excluído!');
    loadUploadedFiles();
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    const { data, error } = await supabase.storage
      .from('user-files')
      .download(file.file_path);

    if (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
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
    if (!shareEmail.trim()) {
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

    const selectedTag = tags.find(t => t.id === selectedTagId);

    if (selectedDocId) {
      // Share document
      const { error } = await supabase
        .from('shared_documents')
        .insert({
          document_id: selectedDocId,
          shared_by_user_id: user.id,
          shared_with_user_id: profiles[0].user_id,
          permission: 'view',
          tag_id: selectedTagId || null,
          tag_name: selectedTag?.name,
          tag_emoji: selectedTag?.emoji,
        });

      if (error) {
        console.error('Erro ao compartilhar:', error);
        toast.error('Erro ao compartilhar documento');
        return;
      }
    } else if (selectedFileId) {
      // Share file
      const { error } = await supabase
        .from('file_shares')
        .insert({
          file_id: selectedFileId,
          shared_by_user_id: user.id,
          shared_with_user_id: profiles[0].user_id,
          permission: 'view',
          tag_id: selectedTagId || null,
          tag_name: selectedTag?.name,
          tag_emoji: selectedTag?.emoji,
        });

      if (error) {
        console.error('Erro ao compartilhar:', error);
        toast.error('Erro ao compartilhar arquivo');
        return;
      }
    }

    toast.success('Compartilhado com sucesso!');
    setShowShareDialog(false);
    setShareEmail('');
    setSelectedDocId(null);
    setSelectedFileId(null);
    setSelectedTagId('');
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
          <p className="text-muted-foreground mt-1">Gerencie seus documentos e arquivos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={() => setShowNewFolderDialog(true)} className="flex-1 sm:flex-none" variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Nova Pasta
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

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
              {documents.length === 0 && uploadedFiles.length === 0 ? (
                <div className="text-center py-16">
                  <File className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">Nenhum arquivo nesta pasta</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comece fazendo upload de arquivos ou processando documentos
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <File className="h-5 w-5 text-blue-500" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              Arquivo
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(file.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadFile(file)}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedFileId(file.id);
                            setShowShareDialog(true);
                          }}
                          title="Compartilhar"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFile(file.id, file.file_path)}
                          title="Excluir"
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
            <DialogTitle>Compartilhar com Etiqueta</DialogTitle>
            <DialogDescription>
              Escolha uma etiqueta personalizada e compartilhe com um usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-tag">Selecione ou crie uma etiqueta</Label>
              <div className="flex gap-2">
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Escolha uma etiqueta" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <span className="flex items-center gap-2">
                          <span>{tag.emoji}</span>
                          <span>{tag.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewTagDialog(true)}
                  title="Nova etiqueta"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-email">Nome ou Email do destinatário</Label>
              <Input
                id="share-email"
                placeholder="Digite o nome ou email do usuário"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShareDocument()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleShareDocument}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Upload */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Confirme o upload do arquivo selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {uploadingFile && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadingFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadingFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUploadFile}>
              <Upload className="mr-2 h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Etiqueta */}
      <Dialog open={showNewTagDialog} onOpenChange={setShowNewTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Etiqueta</DialogTitle>
            <DialogDescription>
              Escolha um emoji e digite um nome para a etiqueta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Emoji da Etiqueta</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewTagEmoji(emoji)}
                    className={`
                      w-12 h-12 text-2xl rounded-lg border-2 transition-all
                      hover:scale-110
                      ${newTagEmoji === emoji
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome da Etiqueta</Label>
              <Input
                id="tag-name"
                placeholder="Ex: Relatórios"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTagDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTag}>
              <Tag className="mr-2 h-4 w-4" />
              Criar Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Arquivos;
