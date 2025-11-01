import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, FolderPlus, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import mammoth from 'mammoth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface Template {
  id: string;
  name: string;
}

interface DocumentInputProps {
  onFileUpload: (text: string, templateId: string, templateName: string, filename: string) => void;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string) => void;
}

const DocumentInput = ({ onFileUpload, selectedTemplateId, onTemplateChange }: DocumentInputProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [pastedText, setPastedText] = useState('');
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file');
  
  // Estados para o modal de novo template
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateFile, setNewTemplateFile] = useState<File | null>(null);
  const [isTemplateModalDragging, setIsTemplateModalDragging] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      
      if (!selectedTemplateId && data && data.length > 0) {
        onTemplateChange(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      toast.error('Formato não suportado', {
        description: 'Por favor, envie arquivos .txt, .docx ou .pdf'
      });
      return;
    }

    setSelectedFile(file);
    toast.success('Documento selecionado', {
      description: `${file.name} pronto para processamento`
    });
  };

  const handleSubmitFile = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    if (!selectedTemplateId) {
      toast.error('Selecione um template');
      return;
    }

    try {
      let text = '';

      // Processar arquivo DOCX com Mammoth
      if (selectedFile.name.endsWith('.docx')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        // Para arquivos TXT, ler normalmente
        const arrayBuffer = await selectedFile.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        text = decoder.decode(arrayBuffer);
      }

      // Sanitizar o texto
      text = text.replace(/\0/g, '').trim();

      if (!text) {
        toast.error('Arquivo vazio', {
          description: 'O arquivo não contém texto válido.'
        });
        return;
      }

      // Buscar o nome do template selecionado
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      const templateName = selectedTemplate?.name || 'Template Desconhecido';

      onFileUpload(text, selectedTemplateId, templateName, selectedFile.name);
      toast.success('Processando documento...');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao ler arquivo', {
        description: 'Não foi possível processar o arquivo.'
      });
    }
  };

  const handleSubmitText = async () => {
    if (!pastedText.trim()) {
      toast.error('Cole ou digite um texto');
      return;
    }

    if (!selectedTemplateId) {
      toast.error('Selecione um template');
      return;
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const templateName = selectedTemplate?.name || 'Template Desconhecido';

    onFileUpload(pastedText.trim(), selectedTemplateId, templateName, 'texto-colado.txt');
    toast.success('Processando texto...');
  };

  // Funções para o modal de template
  const handleTemplateFileSelect = (file: File) => {
    const validTypes = [
      'text/plain',
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/tsx',
      'text/typescript'
    ];
    
    const validExtensions = ['.txt', '.pdf', '.docx', '.doc', '.tsx'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error('Formato inválido', {
        description: 'Por favor, envie um arquivo TXT, PDF, DOC, DOCX ou TSX.'
      });
      return;
    }

    setNewTemplateFile(file);
  };

  const handleTemplateDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTemplateModalDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleTemplateFileSelect(file);
  };

  const handleSaveNewTemplate = async () => {
    if (!newTemplateFile || !newTemplateName.trim()) {
      toast.error('Campos obrigatórios', {
        description: 'Por favor, preencha o nome e selecione um arquivo.'
      });
      return;
    }

    try {
      toast.loading("📥 Lendo arquivo...", { id: "saving-template" });
      
      let text = '';

      // Processar arquivo DOCX com Mammoth
      if (newTemplateFile.name.endsWith('.docx')) {
        const arrayBuffer = await newTemplateFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        // Para arquivos TXT, ler normalmente
        const arrayBuffer = await newTemplateFile.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        text = decoder.decode(arrayBuffer);
      }
      
      // Sanitizar o texto para evitar problemas de Unicode
      text = text.replace(/\0/g, '').trim();
      
      console.log('Arquivo lido, tamanho:', text.length);
      console.log('Primeiros 100 caracteres:', text.substring(0, 100));
      
      // Validar que o conteúdo não está vazio
      if (!text || text.length === 0) {
        toast.dismiss("saving-template");
        toast.error('Arquivo vazio', {
          description: 'O arquivo do template não pode estar vazio.'
        });
        return;
      }
      
      toast.loading("💾 Salvando template...", { id: "saving-template" });
      
      console.log('Tentando salvar template:', {
        name: newTemplateName.trim(),
        contentLength: text.length,
        fileName: newTemplateFile.name
      });
      
      const { data, error } = await supabase
        .from('templates')
        .insert({
          name: newTemplateName.trim(),
          content: text,
          file_name: newTemplateFile.name,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Template salvo com sucesso:', data);
      
      toast.dismiss("saving-template");
      toast.success('✅ Template salvo!', {
        description: `Template "${newTemplateName}" foi adicionado com sucesso.`
      });

      // Limpar e fechar modal
      setShowTemplateModal(false);
      setNewTemplateName('');
      setNewTemplateFile(null);
      
      // Recarregar templates
      await loadTemplates();
      
      // Selecionar automaticamente o novo template
      if (data) {
        onTemplateChange(data.id);
      }
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.dismiss("saving-template");
      
      let errorMessage = 'Não foi possível salvar o template.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('❌ Erro ao salvar', {
        description: errorMessage,
        duration: 6000
      });
    }
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <CardTitle className="text-2xl">Upload de Documento</CardTitle>
        <CardDescription>
          Envie seu relatório técnico para formatação automática com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold">Selecione o Template</Label>
          <div className="flex gap-2">
            {isLoadingTemplates ? (
              <p className="text-sm text-muted-foreground flex-1">Carregando templates...</p>
            ) : templates.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center flex-1">
                <p className="text-sm text-muted-foreground">
                  Nenhum template disponível.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique no ícone de pasta para criar um.
                </p>
              </div>
            ) : (
              <Select 
                value={selectedTemplateId || undefined} 
                onValueChange={onTemplateChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Escolha um template de formatação" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Botão para adicionar novo template */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowTemplateModal(true)}
              className="shrink-0"
              title="Adicionar novo template"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'file' | 'text')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload de Arquivo
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              Colar Texto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="mt-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all backdrop-blur-xl bg-white/40 dark:bg-card/40 ${
                isDragging 
                  ? 'border-primary bg-primary/10 scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <File className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSubmitFile} 
                    className="w-full"
                    disabled={!selectedTemplateId}
                  >
                    Processar Documento
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">
                    Arraste seu documento aqui
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".txt,.docx,.pdf"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <span className="text-primary-foreground">Selecionar Arquivo</span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    Formatos suportados: TXT, DOCX, PDF
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-xl p-6 transition-all backdrop-blur-xl bg-white/40 dark:bg-card/40 border-border hover:border-primary/50">
                <div className="space-y-3">
                  <Label htmlFor="pasted-text" className="text-base font-semibold">
                    Cole ou digite seu texto aqui
                  </Label>
                  <Textarea
                    id="pasted-text"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Cole seu texto aqui ou digite diretamente..."
                    className="min-h-[300px] font-mono text-sm resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {pastedText.length} caracteres
                    </p>
                    {pastedText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPastedText('')}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSubmitText} 
                className="w-full"
                disabled={!selectedTemplateId || !pastedText.trim()}
              >
                Processar Texto
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modal para adicionar novo template */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Template</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo modelo para criar um novo template de formatação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Regime Automotivo (RA)"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                autoFocus
              />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsTemplateModalDragging(true);
              }}
              onDragLeave={() => setIsTemplateModalDragging(false)}
              onDrop={handleTemplateDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isTemplateModalDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {newTemplateFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <File className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{newTemplateFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(newTemplateFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewTemplateFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">
                    Arraste o arquivo aqui
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx,.doc,.tsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTemplateFileSelect(file);
                    }}
                    className="hidden"
                    id="template-file-upload"
                  />
                  <Label htmlFor="template-file-upload">
                    <Button variant="secondary" asChild>
                      <span>Selecionar Arquivo</span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-3">
                    TXT, PDF, DOC, DOCX ou TSX
                  </p>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTemplateModal(false);
                setNewTemplateName('');
                setNewTemplateFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNewTemplate}
              disabled={!newTemplateName.trim() || !newTemplateFile}
            >
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DocumentInput;
