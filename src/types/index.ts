export type Regime = 'Regulatório' | 'Híbrido';

export interface CopilotResult {
  textoFormatado: string;
  sugestoes: string[];
  alertas: string[];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  regime: Regime;
}
