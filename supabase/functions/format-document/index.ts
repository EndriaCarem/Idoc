import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, templateContent, templateName } = await req.json();
    
    if (!documentText || !templateContent) {
      return new Response(
        JSON.stringify({ error: 'Documento e template são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um assistente especializado em formatação de relatórios técnicos de incentivos fiscais brasileiros (Regime Automotivo, Lei de Informática, MOVER).

Sua função é atuar como um COPILOTO DE FORMATAÇÃO, auxiliando analistas na padronização de documentos regulatórios.

CONTEXTO:
- Relatórios de incentivos fiscais são documentos técnicos e regulatórios críticos
- Garantem prestação de contas de investimentos em P&D e inovação
- Devem seguir rigorosamente padrões formais dos programas
- Qualquer não-conformidade pode comprometer benefícios fiscais

TEMPLATE DE REFERÊNCIA:
Este é o modelo aprovado pela empresa para o tipo de regime selecionado:

${templateContent.substring(0, 6000)}

---

SUA TAREFA:
1. Analise a estrutura e formatação do template acima
2. Formate o documento fornecido seguindo EXATAMENTE o padrão do template
3. Mantenha TODO o conteúdo técnico original intacto
4. Ajuste apenas: formatação, estrutura, padronização e terminologia
5. NÃO invente nem adicione informações técnicas

ASPECTOS A FORMATAR:
- Estrutura de seções e hierarquia (seguir template)
- Formatação de títulos e subtítulos (caps, negrito, numeração)
- Espaçamento entre parágrafos e seções
- Listas, numerações e marcadores
- Terminologia técnica padronizada
- Tabelas e formatação de dados
- Normas ABNT se aplicáveis ao template

VERIFICAÇÕES DE CONFORMIDADE:
- Todas as seções obrigatórias do template estão presentes?
- A terminologia está consistente com o template?
- A numeração e hierarquia seguem o padrão?
- Há informações críticas faltando (prazos, valores, responsáveis)?

IMPORTANTE: Retorne APENAS o texto formatado, sem comentários ou explicações.`;

    const userPrompt = `DOCUMENTO A SER FORMATADO:

${documentText.substring(0, 8000)}

---

Por favor, formate este documento seguindo rigorosamente o template de referência fornecido no prompt do sistema.`;

    console.log('Chamando Lovable AI para formatação...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos na sua conta Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const aiData = await response.json();
    const textoFormatado = aiData.choices[0].message.content;

    // Detectar tipo de regime baseado no nome do template
    const tipoRegime = templateName?.toLowerCase() || '';
    
    // Gerar sugestões contextualizadas
    const sugestoes = [
      '✓ Formatação de títulos e hierarquia aplicada conforme template oficial',
      '✓ Estrutura de seções reorganizada para total conformidade regulatória',
      '✓ Terminologia técnica padronizada segundo glossário do programa',
      '✓ Espaçamento, margens e layout ajustados para documento profissional',
      '✓ Numeração de itens e listas corrigida conforme ABNT (quando aplicável)',
      '✓ Padronização de tabelas, gráficos e dados quantitativos',
      '✓ Revisão ortográfica e gramatical automatizada aplicada'
    ];

    // Alertas específicos por tipo de regime
    let alertas: string[] = [];
    
    if (tipoRegime.includes('automotivo') || tipoRegime.includes('ra')) {
      alertas = [
        '⚠️ REGIME AUTOMOTIVO - Verificar seções obrigatórias: Objetivos, Metodologia, Resultados, Investimentos',
        '⚠️ Validar datas de início e fim do projeto no formato dd/mm/aaaa',
        '⚠️ Confirmar valores de investimentos em P&D discriminados por categoria (RH, equipamentos, insumos)',
        '⚠️ Revisar classificação das atividades como Pesquisa Básica, Aplicada ou Desenvolvimento',
        '⚠️ Verificar enquadramento nos percentuais mínimos de investimento em P&D',
        '⚠️ Conferir nomenclatura de veículos e componentes conforme glossário MDIC',
        '⚠️ Atenção: documentos comprobatórios (notas fiscais, contratos) devem estar anexados',
        '⚠️ Validar indicadores de inovação tecnológica e registro de propriedade intelectual'
      ];
    } else if (tipoRegime.includes('informática') || tipoRegime.includes('ppb') || tipoRegime.includes('lei de informática')) {
      alertas = [
        '⚠️ LEI DE INFORMÁTICA/PPB - Verificar descrição detalhada das atividades de P&D realizadas',
        '⚠️ Validar percentual de faturamento investido em P&D (mínimo 5% conforme lei)',
        '⚠️ Confirmar convênios com ICTs (Instituições Científicas e Tecnológicas) quando aplicável',
        '⚠️ Revisar processo de certificação PPB e validade do certificado',
        '⚠️ Verificar atendimento aos requisitos de conteúdo local e processo produtivo básico',
        '⚠️ Conferir metas de exportação e indicadores de desempenho do projeto',
        '⚠️ Atenção: relatórios de auditorias e avaliações técnicas devem estar incluídos',
        '⚠️ Validar registro de patentes, softwares e inovações geradas pelo projeto'
      ];
    } else if (tipoRegime.includes('mover')) {
      alertas = [
        '⚠️ PROGRAMA MOVER - Verificar alinhamento com metas de descarbonização e eficiência energética',
        '⚠️ Validar investimentos em eletrificação, hibridização e tecnologias de baixa emissão',
        '⚠️ Confirmar indicadores de redução de emissões de CO2 e eficiência energética',
        '⚠️ Revisar projetos de P&D em mobilidade sustentável e veículos elétricos',
        '⚠️ Verificar conformidade com requisitos ambientais e certificações (PROCONVE, PROMOT)',
        '⚠️ Conferir cronograma de implantação e marcos de inovação tecnológica',
        '⚠️ Atenção: estudos de impacto ambiental e avaliações de ciclo de vida devem estar presentes',
        '⚠️ Validar parcerias estratégicas para desenvolvimento de tecnologias limpas'
      ];
    } else {
      // Alertas genéricos para outros casos
      alertas = [
        '⚠️ CRÍTICO: Verificar se todas as seções obrigatórias do programa estão preenchidas',
        '⚠️ Validar datas no formato dd/mm/aaaa conforme exigido pela prestação de contas',
        '⚠️ Confirmar valores monetários e percentuais com documentação fonte',
        '⚠️ Revisar referências normativas (leis, portarias, decretos) quanto a numeração e vigência',
        '⚠️ Verificar siglas, abreviações e nomenclaturas técnicas conforme glossário oficial',
        '⚠️ Atenção: responsáveis técnicos e assinaturas devem estar identificados corretamente',
        '⚠️ Conferir prazos regulatórios, marcos do projeto e cronograma de execução',
        '⚠️ Validar anexos obrigatórios (comprovantes, relatórios, certificações)'
      ];
    }

    console.log('Formatação concluída com sucesso');

    return new Response(
      JSON.stringify({
        textoFormatado,
        sugestoes,
        alertas
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao processar:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
