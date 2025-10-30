import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Template {
  id: string;
  name: string;
}

interface DocumentInputProps {
  onFileUpload: (text: string, templateId: string) => void;
  selectedTemplateId: string | null;
  onTemplateChange: (templateId: string) => void;
}

const DocumentInput = ({ onFileUpload, selectedTemplateId, onTemplateChange }: DocumentInputProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

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

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    if (!selectedTemplateId) {
      toast.error('Selecione um template');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileUpload(text, selectedTemplateId);
      toast.success('Processando documento...');
    };
    reader.readAsText(selectedFile);
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
          {isLoadingTemplates ? (
            <p className="text-sm text-muted-foreground">Carregando templates...</p>
          ) : templates.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum template disponível.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie um template na página de gerenciamento.
              </p>
            </div>
          ) : (
            <Select 
              value={selectedTemplateId || undefined} 
              onValueChange={onTemplateChange}
            >
              <SelectTrigger>
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
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
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
                onClick={handleSubmit} 
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
                <Button asChild variant="secondary">
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Formatos suportados: TXT, DOCX, PDF
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentInput;
