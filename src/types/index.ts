export interface CopilotResult {
  textoFormatado: string;
  sugestoes: string[];
  alertas: string[];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  templateId: string;
}
