import type { CopilotResult, Regime } from '@/types';

// Simulação do serviço de IA (Gemini)
// Em produção, isso seria substituído por chamadas reais à API do Gemini
export const formatarComCopilot = async (
  texto: string,
  regime: Regime
): Promise<CopilotResult> => {
  // Simula processamento
  await new Promise(resolve => setTimeout(resolve, 2000));

  const sugestoes = [
    `Documento formatado conforme regime ${regime}`,
    'Estrutura de capítulos e seções padronizada',
    'Numeração de páginas e referências ajustadas',
    'Formatação de tabelas e figuras corrigida',
    'Citações e bibliografia formatadas conforme ABNT'
  ];

  const alertas = regime === 'Regulatório' 
    ? [
        'Verificar conformidade com REN ANEEL nº 1.000/2021',
        'Incluir declaração de conformidade regulatória',
        'Validar prazos de entrega conforme cronograma'
      ]
    : [
        'Confirmar categorização do projeto como P&D',
        'Verificar aderência aos requisitos técnicos',
        'Validar documentação de propriedade intelectual'
      ];

  // Formata o texto de exemplo
  const textoFormatado = `# ${regime === 'Regulatório' ? 'RELATÓRIO TÉCNICO REGULATÓRIO' : 'RELATÓRIO TÉCNICO P&D'}

## 1. INTRODUÇÃO

${texto.substring(0, 200)}...

## 2. OBJETIVO

Este relatório tem como objetivo apresentar...

## 3. METODOLOGIA

A metodologia aplicada seguiu os seguintes passos:
- Análise preliminar dos requisitos
- Desenvolvimento da solução proposta
- Validação e testes

## 4. RESULTADOS

Os resultados obtidos demonstram...

## 5. CONCLUSÃO

Conclui-se que os objetivos foram atingidos...

---
**Documento formatado automaticamente pelo Copiloto de Formatação**
`;

  return {
    textoFormatado,
    sugestoes,
    alertas
  };
};
