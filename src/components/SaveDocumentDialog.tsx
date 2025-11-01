import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FolderPlus } from 'lucide-react';

interface SaveDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentData: {
    originalText: string;
    formattedText: string;
    templateName: string;
    alertsCount: number;
    suggestionsCount: number;
  };
}

interface Folder {
  id: string;
  name: string;
}

export function SaveDocumentDialog({ open, onOpenChange, documentData }: SaveDocumentDialogProps) {
  const [documentName, setDocumentName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('id, name')
      .is('parent_folder_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pastas:', error);
      return;
    }

    setFolders(data || []);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Digite um nome para a pasta');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('folders')
      .insert({
        name: newFolderName.trim(),
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pasta:', error);
      toast.error('Erro ao criar pasta');
      return;
    }

    toast.success('Pasta criada!');
    setFolders([data, ...folders]);
    setSelectedFolder(data.id);
    setShowNewFolderInput(false);
    setNewFolderName('');
  };

  const handleSaveDocument = async () => {
    if (!documentName.trim()) {
      toast.error('Digite um nome para o documento');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const { error } = await supabase
        .from('saved_documents')
        .insert({
          user_id: user.id,
          folder_id: selectedFolder,
          name: documentName.trim(),
          original_text: documentData.originalText,
          formatted_text: documentData.formattedText,
          template_name: documentData.templateName,
          alerts_count: documentData.alertsCount,
          suggestions_count: documentData.suggestionsCount,
        });

      if (error) {
        console.error('Erro ao salvar documento:', error);
        toast.error('Erro ao salvar documento');
        return;
      }

      toast.success('Documento salvo com sucesso!');
      setDocumentName('');
      setSelectedFolder(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar documento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar Documento</DialogTitle>
          <DialogDescription>
            Salve seu documento formatado para acessar depois
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Nome do Documento</Label>
            <Input
              id="doc-name"
              placeholder="Ex: Relatório Anual 2024"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pasta (Opcional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Pasta
              </Button>
            </div>

            {showNewFolderInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da pasta"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <Button onClick={handleCreateFolder}>Criar</Button>
                <Button variant="outline" onClick={() => setShowNewFolderInput(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select value={selectedFolder || undefined} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pasta ou deixe em branco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Sem pasta</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveDocument} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
