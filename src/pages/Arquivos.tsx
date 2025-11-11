import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderPlus, File, Folder, Share2, Trash2, Download, Edit, FileText, ChevronRight, Upload, Tag, Smile, MoreVertical, Palette, Eye, Bot, Bold, Italic, List, Heading1, Heading2, Underline, Code, Quote, ListOrdered, Undo, Redo, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '@/components/ui/textarea';
import LoadingRobot from '@/components/LoadingRobot';

const COMMON_EMOJIS = ['📄', '📁', '📊', '📈', '📉', '📋', '📝', '📌', '📎', '🔖', '💼', '📦', '🗂️', '📑', '📃', '📜', '📰', '🗞️', '📚', '📖', '📕', '📗', '📘', '📙'];

interface SavedDocument {
  id: string;
  name: string;
  formatted_text: string;
  original_text?: string;
  template_name: string;
  created_at: string;
  folder_id: string | null;
}

interface FolderType {
  id: string;
  name: string;
  created_at: string;
  color?: string;
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
  const [showRenameFolderDialog, setShowRenameFolderDialog] = useState(false);
  const [showColorPickerDialog, setShowColorPickerDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [showDocumentViewDialog, setShowDocumentViewDialog] = useState(false);
  const [deleteFolderConfirmName, setDeleteFolderConfirmName] = useState('');
  const [showFolderActionsSheet, setShowFolderActionsSheet] = useState(false);
  const [showFileActionsSheet, setShowFileActionsSheet] = useState(false);
  const [showDocActionsSheet, setShowDocActionsSheet] = useState(false);
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<FolderType | null>(null);
  const [selectedFileForAction, setSelectedFileForAction] = useState<UploadedFile | null>(null);
  const [selectedDocForAction, setSelectedDocForAction] = useState<SavedDocument | null>(null);
  const [editedDocumentContent, setEditedDocumentContent] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('📄');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingCopilot, setIsProcessingCopilot] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingDocName, setIsEditingDocName] = useState(false);
  const [editedDocName, setEditedDocName] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateForCopilot, setSelectedTemplateForCopilot] = useState<string>('');
  const [availableTemplates, setAvailableTemplates] = useState<Array<{id: string, name: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadData();
    loadTemplates();
  }, [selectedFolder]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name')
        .order('created_at', { ascending: false});

      if (error) throw error;
      setAvailableTemplates(data || []);
      
      // Selecionar o template mais recente por padrão
      if (data && data.length > 0) {
        setSelectedTemplateForCopilot(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

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

    // Buscar nomes dos templates
    if (data && data.length > 0) {
      const templateIds = [...new Set(data.map(doc => doc.template_name).filter(Boolean))];
      
      if (templateIds.length > 0) {
        const { data: templates } = await supabase
          .from('templates')
          .select('id, name')
          .in('id', templateIds);

        const templateMap = new Map(templates?.map(t => [t.id, t.name]) || []);
        
        // Atualizar documentos com nomes dos templates
        const documentsWithNames = data.map(doc => ({
          ...doc,
          template_name: templateMap.get(doc.template_name) || doc.template_name
        }));
        
        setDocuments(documentsWithNames);
        return;
      }
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

  const handleDeleteFolder = async () => {
    if (!selectedFolderForAction) return;

    if (deleteFolderConfirmName.trim() !== selectedFolderForAction.name) {
      toast.error('O nome da pasta não corresponde');
      return;
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', selectedFolderForAction.id);

    if (error) {
      console.error('Erro ao excluir pasta:', error);
      toast.error('Erro ao excluir pasta');
      return;
    }

    toast.success('Pasta excluída com sucesso!');
    if (selectedFolder === selectedFolderForAction.id) {
      setSelectedFolder(null);
    }
    setShowDeleteFolderDialog(false);
    setDeleteFolderConfirmName('');
    setSelectedFolderForAction(null);
    loadFolders();
  };

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim() || !selectedFolderForAction) {
      toast.error('Digite um nome para a pasta');
      return;
    }

    const { error } = await supabase
      .from('folders')
      .update({ name: renameFolderName.trim() })
      .eq('id', selectedFolderForAction.id);

    if (error) {
      console.error('Erro ao renomear pasta:', error);
      toast.error('Erro ao renomear pasta');
      return;
    }

    toast.success('Pasta renomeada com sucesso!');
    setShowRenameFolderDialog(false);
    setRenameFolderName('');
    setSelectedFolderForAction(null);
    loadFolders();
  };

  const handleUpdateFolderColor = async (color: string) => {
    if (!selectedFolderForAction) return;

    const { error } = await supabase
      .from('folders')
      .update({ color })
      .eq('id', selectedFolderForAction.id);

    if (error) {
      console.error('Erro ao atualizar cor da pasta:', error);
      toast.error('Erro ao atualizar cor da pasta');
      return;
    }

    toast.success('Cor da pasta atualizada!');
    setShowColorPickerDialog(false);
    setSelectedFolderForAction(null);
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
      toast.error('Digite um email ou nome válido');
      return;
    }

    // Buscar usuário por nome ou email na tabela profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .or(`full_name.ilike.%${shareEmail}%`)
      .limit(10);

    if (profileError || !profiles || profiles.length === 0) {
      toast.error('Usuário não encontrado. Verifique o email ou nome.');
      console.error('Erro ao buscar usuário:', profileError);
      return;
    }

    const targetUserId = profiles[0].user_id;

    if (!targetUserId) {
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
          shared_with_user_id: targetUserId,
          permission: 'view',
          tag_id: selectedTagId || null,
          tag_name: selectedTag?.name,
          tag_emoji: selectedTag?.emoji,
        });

      if (error) {
        console.error('Erro ao compartilhar documento:', error);
        toast.error(`Erro ao compartilhar: ${error.message}`);
        return;
      }
    } else if (selectedFileId) {
      // Share file
      const { error } = await supabase
        .from('file_shares')
        .insert({
          file_id: selectedFileId,
          shared_by_user_id: user.id,
          shared_with_user_id: targetUserId,
          permission: 'view',
          tag_id: selectedTagId || null,
          tag_name: selectedTag?.name,
          tag_emoji: selectedTag?.emoji,
        });

      if (error) {
        console.error('Erro ao compartilhar arquivo:', error);
        toast.error(`Erro ao compartilhar: ${error.message}`);
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

  const handleDeleteTag = async (tagId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const { error } = await supabase
      .from('file_tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Erro ao excluir etiqueta:', error);
      toast.error('Erro ao excluir etiqueta');
      return;
    }

    toast.success('Etiqueta excluída!');
    if (selectedTagId === tagId) {
      setSelectedTagId('');
    }
    loadTags();
  };

  const handleSaveDocument = async () => {
    if (!selectedDocForAction) return;

    const { error } = await supabase
      .from('saved_documents')
      .update({ formatted_text: editedDocumentContent })
      .eq('id', selectedDocForAction.id);

    if (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento');
      return;
    }

    toast.success('Documento salvo com sucesso!');
    setShowDocumentViewDialog(false);
    loadDocuments();
  };

  const handleRenameDocument = async () => {
    if (!selectedDocForAction || !editedDocName.trim()) return;

    const { error } = await supabase
      .from('saved_documents')
      .update({ name: editedDocName.trim() })
      .eq('id', selectedDocForAction.id);

    if (error) {
      console.error('Erro ao renomear documento:', error);
      toast.error('Erro ao renomear documento');
      return;
    }

    toast.success('Documento renomeado com sucesso!');
    setIsEditingDocName(false);
    setSelectedDocForAction({ ...selectedDocForAction, name: editedDocName.trim() });
    loadDocuments();
  };

  const handleSendToCopilot = async () => {
    if (!selectedDocForAction) return;
    
    // Mostrar seletor de template
    setShowTemplateSelector(true);
  };

  const confirmSendToCopilot = async () => {
    if (!selectedDocForAction || !selectedTemplateForCopilot) return;
    
    try {
      setShowTemplateSelector(false);
      setIsProcessingCopilot(true);
      console.log('selectedDocForAction:', selectedDocForAction);
      
      // Verificar se é um documento salvo (tem formatted_text)
      if ('formatted_text' in selectedDocForAction && selectedDocForAction.formatted_text) {
        console.log('Tipo: documento salvo (saved_documents)');
        
        // Aguarda um pouco para mostrar a animação
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Buscar nome do template selecionado
        const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateForCopilot);
        
        // Para documentos salvos, passamos o texto diretamente
        const dataToStore = {
          type: 'file',
          content: selectedDocForAction.original_text || selectedDocForAction.formatted_text,
          filename: selectedDocForAction.name,
          templateId: selectedTemplateForCopilot,
          templateName: selectedTemplate?.name
        };
        console.log('Salvando no sessionStorage:', dataToStore);
        sessionStorage.setItem('copilot_doc', JSON.stringify(dataToStore));
        window.location.href = '/';
        return;
      }
      
      // Se não tem formatted_text, é um arquivo de uploaded_files
      console.log('Tipo: arquivo carregado (uploaded_files)');
      const fileToProcess = uploadedFiles.find(f => f.id === selectedDocForAction.id);
      console.log('Arquivo encontrado:', fileToProcess);
      
      if (!fileToProcess) {
        toast.error('Arquivo não encontrado');
        setIsProcessingCopilot(false);
        return;
      }

      // Baixar o conteúdo do arquivo
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(fileToProcess.file_path);

      console.log('Download result:', { data, error });

      if (error || !data) {
        toast.error('Erro ao carregar arquivo');
        setIsProcessingCopilot(false);
        return;
      }

      // Ler o conteúdo
      let content = '';
      if (fileToProcess.file_type === 'text/plain') {
        content = await data.text();
      } else if (fileToProcess.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = (await import('mammoth')).default;
        const arrayBuffer = await data.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        toast.error('Tipo de arquivo não suportado para análise');
        setIsProcessingCopilot(false);
        return;
      }

      console.log('Conteúdo lido:', content.substring(0, 100));

      // Aguarda um pouco para mostrar a animação
      await new Promise(resolve => setTimeout(resolve, 800));

      // Buscar nome do template selecionado
      const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateForCopilot);

      // Salvar no sessionStorage
      const dataToStore = {
        type: 'file',
        content: content,
        filename: fileToProcess.name,
        templateId: selectedTemplateForCopilot,
        templateName: selectedTemplate?.name
      };
      console.log('Salvando no sessionStorage:', dataToStore);
      sessionStorage.setItem('copilot_doc', JSON.stringify(dataToStore));

      // Redirecionar
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao enviar para copilot:', error);
      toast.error('Erro ao processar arquivo');
      setIsProcessingCopilot(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('document-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedDocumentContent;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setEditedDocumentContent(newText);
    
    // Restaurar foco e seleção
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleBold = () => insertFormatting('**', '**');
  const handleItalic = () => insertFormatting('*', '*');
  const handleUnderline = () => insertFormatting('<u>', '</u>');
  const handleHeading1 = () => insertFormatting('# ');
  const handleHeading2 = () => insertFormatting('## ');
  const handleList = () => insertFormatting('- ');
  const handleOrderedList = () => insertFormatting('1. ');
  const handleCode = () => insertFormatting('`', '`');
  const handleCodeBlock = () => insertFormatting('\n```\n', '\n```\n');
  const handleQuote = () => insertFormatting('> ');

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
    <>
      {isProcessingCopilot && <LoadingRobot message="Preparando documento para análise..." />}
      
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meus Arquivos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie seus documentos e arquivos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none h-10 sm:h-10">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={() => setShowNewFolderDialog(true)} className="flex-1 sm:flex-none h-10 sm:h-10" variant="outline">
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
                <div
                  key={folder.id}
                  className={`
                    w-full px-4 py-3 rounded-lg transition-all
                    flex items-center gap-3 group relative
                    ${selectedFolder === folder.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent'
                    }
                  `}
                  style={{
                    backgroundColor: selectedFolder === folder.id ? folder.color || '#4F86F7' : undefined
                  }}
                >
                  <button
                    onClick={() => setSelectedFolder(folder.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Folder className="h-4 w-4" />
                    <span className="font-medium text-sm truncate">{folder.name}</span>
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFolderForAction(folder);
                          setRenameFolderName(folder.name);
                          setShowRenameFolderDialog(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFolderForAction(folder);
                          setShowColorPickerDialog(true);
                        }}
                      >
                        <Palette className="mr-2 h-4 w-4" />
                        Mudar Cor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFolderForAction(folder);
                          setShowDeleteFolderDialog(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                    {documents.length + uploadedFiles.length} arquivo(s) encontrado(s)
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
                        {/* Botão de visualização para arquivos de texto, DOCX e PDF */}
                        {(file.file_type === 'text/plain' || 
                          file.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                          file.file_type === 'application/pdf') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              if (file.file_type === 'application/pdf') {
                                // Para PDFs, abrir em nova aba
                                const { data: { publicUrl } } = supabase.storage
                                  .from('user-files')
                                  .getPublicUrl(file.file_path);
                                window.open(publicUrl, '_blank');
                                return;
                              }
                              
                              // Baixar arquivo
                              const { data, error } = await supabase.storage
                                .from('user-files')
                                .download(file.file_path);
                              
                              if (error) {
                                toast.error('Erro ao carregar arquivo');
                                return;
                              }
                              
                              let content = '';
                              
                              if (file.file_type === 'text/plain') {
                                // Arquivos de texto
                                content = await data.text();
                              } else if (file.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                                // Arquivos DOCX
                                try {
                                  const mammoth = (await import('mammoth')).default;
                                  const arrayBuffer = await data.arrayBuffer();
                                  const result = await mammoth.convertToHtml({ arrayBuffer });
                                  content = result.value;
                                } catch (err) {
                                  console.error('Erro ao processar DOCX:', err);
                                  toast.error('Erro ao processar documento Word');
                                  return;
                                }
                              }
                              
                              setEditedDocumentContent(content);
                              setSelectedDocForAction({ 
                                id: file.id, 
                                name: file.name,
                                formatted_text: content,
                                template_name: file.file_type === 'text/plain' ? 'Arquivo de Texto' : 'Documento Word',
                                created_at: file.created_at,
                                folder_id: file.folder_id
                              } as SavedDocument);
                              setShowDocumentViewDialog(true);
                            }}
                            title="Visualizar/Editar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id, file.file_path);
                          }}
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
                      className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedDocForAction(doc);
                        setEditedDocumentContent(doc.formatted_text);
                        setShowDocumentViewDialog(true);
                      }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocForAction(doc);
                            setEditedDocumentContent(doc.formatted_text);
                            setShowDocumentViewDialog(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(doc);
                          }}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
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
                  <SelectContent className="bg-background z-50">
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

            {/* Lista de etiquetas existentes para gerenciar */}
            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>Gerenciar Etiquetas</Label>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span>{tag.emoji}</span>
                        <span>{tag.name}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleDeleteTag(tag.id, e)}
                        title="Excluir etiqueta"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* Dialog para renomear pasta */}
      <Dialog open={showRenameFolderDialog} onOpenChange={setShowRenameFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Pasta</DialogTitle>
            <DialogDescription>
              Digite o novo nome para a pasta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-folder">Nome da Pasta</Label>
              <Input
                id="rename-folder"
                placeholder="Digite o novo nome"
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameFolderDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameFolder}>
              <Edit className="mr-2 h-4 w-4" />
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para escolher cor da pasta */}
      <Dialog open={showColorPickerDialog} onOpenChange={setShowColorPickerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mudar Cor da Pasta</DialogTitle>
            <DialogDescription>
              Escolha uma cor para a pasta "{selectedFolderForAction?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {['#4F86F7', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleUpdateFolderColor(color)}
                  className="w-full h-12 rounded-lg border-2 border-border hover:border-foreground transition-all hover:scale-105"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowColorPickerDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão de pasta */}
      <Dialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pasta</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Para confirmar, digite o nome da pasta exatamente como aparece abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da pasta a ser excluída:</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{selectedFolderForAction?.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-folder-name">Digite o nome da pasta para confirmar:</Label>
              <Input
                id="confirm-folder-name"
                placeholder={selectedFolderForAction?.name || ''}
                value={deleteFolderConfirmName}
                onChange={(e) => setDeleteFolderConfirmName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDeleteFolder()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteFolderDialog(false);
                setDeleteFolderConfirmName('');
                setSelectedFolderForAction(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteFolder}
              disabled={deleteFolderConfirmName.trim() !== selectedFolderForAction?.name}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar e editar documento */}
      <Dialog open={showDocumentViewDialog} onOpenChange={setShowDocumentViewDialog}>
        <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
          <DialogHeader className="border-b pb-4 px-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  {isEditingDocName ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editedDocName}
                        onChange={(e) => setEditedDocName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameDocument();
                          if (e.key === 'Escape') {
                            setIsEditingDocName(false);
                            setEditedDocName(selectedDocForAction?.name || '');
                          }
                        }}
                        className="text-2xl font-semibold h-auto py-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleRenameDocument}
                        className="h-8 w-8"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingDocName(false);
                          setEditedDocName(selectedDocForAction?.name || '');
                        }}
                        className="h-8 w-8"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{selectedDocForAction?.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingDocName(true);
                          setEditedDocName(selectedDocForAction?.name || '');
                        }}
                        className="h-6 w-6"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Template: {selectedDocForAction?.template_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedDocForAction?.created_at && format(new Date(selectedDocForAction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col gap-4 py-4 px-6 overflow-hidden">
            {/* Tabs para Edição e Pré-visualização */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  !showPreview 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Editar
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  showPreview 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Pré-visualização
              </button>
            </div>

            {!showPreview ? (
              <>
                {/* Barra de ferramentas de formatação */}
                <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBold}
                      title="Negrito (Ctrl+B)"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleItalic}
                      title="Itálico (Ctrl+I)"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnderline}
                      title="Sublinhado"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="w-px h-9 bg-border" />
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHeading1}
                      title="Título 1"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHeading2}
                      title="Título 2"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Heading2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="w-px h-9 bg-border" />
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleList}
                      title="Lista com marcadores"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOrderedList}
                      title="Lista numerada"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="w-px h-9 bg-border" />
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCode}
                      title="Código inline"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleQuote}
                      title="Citação"
                      className="h-9 w-9 p-0 hover:bg-background"
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <Textarea
                    id="document-content"
                    value={editedDocumentContent}
                    onChange={(e) => setEditedDocumentContent(e.target.value)}
                    className="flex-1 font-mono text-sm resize-none h-full"
                    placeholder="Digite o conteúdo do documento..."
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                    <span>{editedDocumentContent.length} caracteres</span>
                    <span>{editedDocumentContent.split('\n').length} linhas</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-auto p-6 bg-muted/20 rounded-lg border prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                  __html: editedDocumentContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^- (.*$)/gim, '<li>$1</li>')
                    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
                    .replace(/`(.*?)`/g, '<code>$1</code>')
                    .replace(/\n/g, '<br>')
                }} />
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDocumentViewDialog(false);
                setSelectedDocForAction(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSendToCopilot}
            >
              <Bot className="mr-2 h-4 w-4" />
              Analisar com Copilot
            </Button>
            <Button onClick={handleSaveDocument}>
              <Edit className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de seleção de template */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Template</DialogTitle>
            <DialogDescription>
              Escolha qual template será usado para analisar o documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedTemplateForCopilot} onValueChange={setSelectedTemplateForCopilot}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateSelector(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSendToCopilot}>
              <Bot className="mr-2 h-4 w-4" />
              Analisar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default Arquivos;
