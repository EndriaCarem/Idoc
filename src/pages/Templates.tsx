import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Trash2, FileText, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Template {
  id: string;
  name: string;
  content: string;
  file_name: string | null;
  created_at: string;
}

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro ao carregar templates',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, envie um arquivo TXT, PDF ou DOCX.',
        variant: 'destructive',
      });
      return;
    }

    setTemplateFile(file);
    setShowDialog(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSaveTemplate = async () => {
    if (!templateFile || !templateName.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome do template.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const text = await templateFile.text();
      
      const { error } = await supabase
        .from('templates')
        .insert({
          name: templateName.trim(),
          content: text,
          file_name: templateFile.name,
        });

      if (error) throw error;

      toast({
        title: 'Template salvo!',
        description: `Template "${templateName}" foi adicionado com sucesso.`,
      });

      setShowDialog(false);
      setTemplateName('');
      setTemplateFile(null);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o template "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Template excluído',
        description: `Template "${name}" foi removido.`,
      });

      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o template.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-2 -ml-2 text-sm sm:text-base"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Gerenciar Templates
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Adicione templates de formatação personalizados para seus regimes
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <Card
            className={`border-2 border-dashed transition-all ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="p-6 sm:p-12 text-center">
              <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Adicionar Novo Template
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-2">
                Arraste e solte um arquivo ou clique para selecionar
              </p>
              <Input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos suportados: TXT, PDF, DOCX
              </p>
            </div>
          </Card>

          {/* Templates List */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Templates Salvos</h2>
            
            {isLoading ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Carregando templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center">
                <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Nenhum template cadastrado ainda
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{template.name}</h3>
                          {template.file_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {template.file_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </Card>
                ))}
              </div>
          )}
        </div>
      </div>

      {/* Dialog para nomear o template */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nomear Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: RA Padrão 2025"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus
              />
            </div>
            {templateFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo: {templateFile.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
