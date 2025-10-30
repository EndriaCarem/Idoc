import { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { Regime } from '@/types';

interface DocumentInputProps {
  onFileUpload: (text: string) => void;
  selectedRegime: Regime;
  onRegimeChange: (regime: Regime) => void;
}

const DocumentInput = ({ onFileUpload, selectedRegime, onRegimeChange }: DocumentInputProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileUpload(text);
      toast.success('Documento carregado', {
        description: `${file.name} foi carregado com sucesso`
      });
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileUpload(text);
      };
      reader.readAsText(selectedFile);
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
          <Label className="text-base font-semibold">Tipo de Regime</Label>
          <RadioGroup
            value={selectedRegime}
            onValueChange={(value) => onRegimeChange(value as Regime)}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="regulatorio"
              className={`flex items-center space-x-2 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedRegime === 'Regulatório' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="Regulatório" id="regulatorio" />
              <div>
                <div className="font-semibold">Regulatório</div>
                <div className="text-xs text-muted-foreground">REN/ANEEL</div>
              </div>
            </Label>
            <Label
              htmlFor="hibrido"
              className={`flex items-center space-x-2 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedRegime === 'Híbrido' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="Híbrido" id="hibrido" />
              <div>
                <div className="font-semibold">Híbrido</div>
                <div className="text-xs text-muted-foreground">P&D/PD&I</div>
              </div>
            </Label>
          </RadioGroup>
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
              <Button onClick={handleSubmit} className="w-full">
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
