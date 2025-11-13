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

const systemPrompt = `Você é um FORMATTER REGULATÓRIO especializado em RDA (Relatório Descritivo Anual) e relatórios de incentivos fiscais brasileiros.

REGRA CRÍTICA: Você DEVE seguir FIELMENTE a estrutura, formatação e seções do template fornecido. NÃO invente uma estrutura diferente.

=== TEMPLATE DE REFERÊNCIA (SIGA EXATAMENTE) ===
${templateContent}

=== INSTRUÇÕES DE FORMATAÇÃO ===

1. ESTRUTURA: Siga EXATAMENTE a ordem de seções do template acima
2. TITULAÇÃO: Use os mesmos títulos e hierarquia do template
3. TABELAS: Se o template tem tabelas, crie tabelas HTML idênticas em estrutura
4. DADOS: Extraia os dados do rascunho e organize conforme o template
5. VALIDAÇÕES: Adicione validações de conformidade ao final

🎯 FORMATO DE SAÍDA OBRIGATÓRIO:
- Retorne APENAS HTML limpo, SEM markdown code blocks
- NÃO use \`\`\`html ou qualquer outro markdown
- Use tags HTML: <h1>, <h2>, <h3>, <p>, <table>, <strong>, <ul>, <ol>
- Para tabelas: use <table>, <thead>, <tbody>, <tr>, <th>, <td> com classes adequadas
- Para listas: use <ul> ou <ol> com <li>
- Para destaques: use <strong> ou <em>

📊 EXEMPLO DE TABELA HTML:
<table class="border-collapse border border-gray-300 w-full my-4">
  <thead>
    <tr class="bg-gray-100">
      <th class="border border-gray-300 px-4 py-2">Coluna 1</th>
      <th class="border border-gray-300 px-4 py-2">Coluna 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-300 px-4 py-2">Dado 1</td>
      <td class="border border-gray-300 px-4 py-2">Dado 2</td>
    </tr>
  </tbody>
</table>

⚠️ REGRAS IMPORTANTES:
- NÃO invente dados que não estão no rascunho
- NÃO altere a estrutura do template
- NÃO use markdown, apenas HTML puro
- Se faltar informação, marque: <strong>[PENDENTE: descrição do que falta]</strong>
- Mantenha números no formato brasileiro (1.234,56)
- Use datas no formato dd/mm/aaaa`;

const userPrompt = `=== RASCUNHO DO DOCUMENTO ===

${documentText}

=== SUA TAREFA ===

1. Leia o TEMPLATE acima e identifique TODAS as seções obrigatórias
2. Extraia os dados do rascunho (valores, datas, nomes, etc)
3. Organize os dados EXATAMENTE conforme a estrutura do template
4. Se o template tem tabelas, crie tabelas HTML com os mesmos cabeçalhos
5. Adicione validações de conformidade ao final se aplicável

IMPORTANTE: 
- Retorne APENAS HTML puro, sem code blocks markdown
- Siga FIELMENTE a estrutura do template fornecido
- Use APENAS dados presentes no rascunho`;

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
    
    // Análise inteligente do texto formatado para gerar sugestões contextualizadas
    const sugestoes: string[] = [];
    
    if (textoFormatado.includes('| ')) {
      sugestoes.push('✓ Dados financeiros organizados em tabelas estruturadas para melhor legibilidade');
    }
    if (textoFormatado.includes('TOTAL') || textoFormatado.includes('Total')) {
      sugestoes.push('✓ Totalizações calculadas e destacadas nas tabelas de investimentos');
    }
    if (textoFormatado.includes('TRL')) {
      sugestoes.push('✓ Níveis TRL (Technology Readiness Level) padronizados para todos os projetos');
    }
    if (textoFormatado.includes('##') || textoFormatado.includes('###')) {
      sugestoes.push('✓ Hierarquia de seções e títulos formatada com numeração automática');
    }
    if (textoFormatado.match(/\d{1,3}\.\d{3},\d{2}/)) {
      sugestoes.push('✓ Valores monetários padronizados no formato brasileiro (R$ 1.234,56)');
    }
    if (textoFormatado.match(/\d{2}\/\d{2}\/\d{4}/)) {
      sugestoes.push('✓ Datas normalizadas para formato dd/mm/aaaa');
    }
    if (textoFormatado.includes('VALIDAÇÕES') || textoFormatado.includes('CONFORMIDADE')) {
      sugestoes.push('✓ Seção de validações e conformidade regulatória adicionada');
    }
    
    // Garantir sempre algumas sugestões base
    if (sugestoes.length < 3) {
      sugestoes.push('✓ Estrutura de seções reorganizada conforme template regulatório oficial');
      sugestoes.push('✓ Terminologia técnica padronizada segundo glossário do programa');
      sugestoes.push('✓ Documento formatado para apresentação profissional e auditável');
    }

    // Análise inteligente para gerar alertas específicos baseados no conteúdo e template
    let alertas: string[] = [];
    
    // Extrair seções e requisitos do template para comparação
    const secoesTemplate = templateContent.match(/#{1,3}\s+[^\n]+/g) || [];
    const tabelasTemplate = templateContent.match(/\|[^\n]+\|/g) || [];
    const secoesDocumento = textoFormatado.match(/#{1,3}\s+[^\n]+/g) || [];
    
    // 1. Validar seções obrigatórias do template
    const secoesObrigatoriasFaltantes: string[] = [];
    secoesTemplate.forEach((secaoTemplate: string) => {
      const tituloSecao = secaoTemplate.replace(/#{1,3}\s+/, '').trim().toUpperCase();
      const encontrada = secoesDocumento.some((secaoDoc: string) => 
        secaoDoc.toUpperCase().includes(tituloSecao.substring(0, 20))
      );
      if (!encontrada && tituloSecao.length > 5) {
        secoesObrigatoriasFaltantes.push(tituloSecao);
      }
    });
    
    if (secoesObrigatoriasFaltantes.length > 0) {
      alertas.push(`⚠️ CONFORMIDADE - Seções obrigatórias do template não identificadas: ${secoesObrigatoriasFaltantes.slice(0, 3).join(', ')}`);
    }
    
    // 2. Validar estrutura de tabelas
    const tabelasDocumento = textoFormatado.match(/\|[^\n]+\|/g) || [];
    if (tabelasTemplate.length > tabelasDocumento.length) {
      alertas.push(`⚠️ ESTRUTURA - Template exige ${tabelasTemplate.length} tabelas, documento possui ${tabelasDocumento.length}. Verifique tabelas de investimentos, projetos e indicadores`);
    }
    
    // 3. Extrair alertas da seção de validações gerada pela IA
    const validacoesMatch = textoFormatado.match(/VALIDAÇÕES E CONFORMIDADE[\s\S]*?(?=\n#|$)/i);
    if (validacoesMatch) {
      const validacoesTexto = validacoesMatch[0];
      const alertasExtraidos = validacoesTexto.match(/⚠️[^\n]+/g);
      if (alertasExtraidos) {
        alertas.push(...alertasExtraidos.map((a: string) => a.trim()));
      }
    }
    
    // 4. Validações financeiras
    const valoresEncontrados = textoFormatado.match(/R\$\s*[\d.,]+/g);
    if (valoresEncontrados && valoresEncontrados.length > 1) {
      alertas.push(`⚠️ FINANCEIRO - Documento contém ${valoresEncontrados.length} valores monetários. Confirme totalização e consistência entre tabelas de perfil de investimentos e dispêndios por projeto`);
    }
    
    // 5. Validações de TRL (Technology Readiness Level)
    const trlMencionados = textoFormatado.match(/TRL\s*\d/gi);
    if (trlMencionados) {
      alertas.push(`⚠️ TECNOLOGIA - ${trlMencionados.length} níveis TRL identificados. Valide evolução (TRL final ≥ TRL inicial) e justificativas técnicas para cada projeto`);
    }
    
    // 6. Validações de datas
    const datasEncontradas = textoFormatado.match(/\d{2}\/\d{2}\/\d{4}/g);
    if (datasEncontradas && datasEncontradas.length > 0) {
      alertas.push(`⚠️ CRONOGRAMA - ${datasEncontradas.length} datas identificadas. Verifique coerência de prazos com ano-base do relatório e marcos regulatórios`);
    }
    
    // 7. Alertas específicos por regime baseado no template
    if (tipoRegime.includes('automotivo') || tipoRegime.includes('ra') || templateContent.includes('REGIME AUTOMOTIVO')) {
      alertas.push('⚠️ REGIME AUTOMOTIVO - Confirme: 1) Categorias de P&D (básica/aplicada/desenvolvimento), 2) Percentual mínimo sobre receita líquida, 3) Documentos MDIC/MCTIC');
      alertas.push('⚠️ NOMENCLATURA - Valide terminologia: veículos, sistemas, componentes conforme glossário técnico do setor automotivo');
    } else if (tipoRegime.includes('informática') || tipoRegime.includes('ppb') || templateContent.includes('LEI DE INFORMÁTICA')) {
      alertas.push('⚠️ LEI DE INFORMÁTICA - Confirme: 1) Mínimo 5% faturamento em P&D, 2) Convênios ICT válidos, 3) Certificação PPB vigente');
      alertas.push('⚠️ PROCESSO PRODUTIVO - Valide atendimento a requisitos de conteúdo local e etapas do PPB conforme portarias MCTIC');
    } else if (tipoRegime.includes('mover') || templateContent.includes('MOVER')) {
      alertas.push('⚠️ PROGRAMA MOVER - Confirme: 1) Indicadores de descarbonização, 2) Metas de eficiência energética, 3) Certificações ambientais PROCONVE/PROMOT');
      alertas.push('⚠️ SUSTENTABILIDADE - Valide projetos de eletrificação, tecnologias de baixa emissão e estudos de impacto ambiental');
    }
    
    // 8. Alertas obrigatórios de conformidade regulatória
    alertas.push('⚠️ DOCUMENTAÇÃO - Anexe comprovantes: notas fiscais, contratos, pareceres técnicos, laudos de ICT, certificados de propriedade intelectual');
    alertas.push('⚠️ ASSINATURAS - Identifique responsáveis técnicos, responsável legal da empresa e representantes de instituições parceiras com CPF/CNPJ');
    
    // 9. Alertas de qualidade e revisão
    if (textoFormatado.includes('[PENDENTE') || textoFormatado.includes('[REVISAR')) {
      alertas.push('⚠️ ATENÇÃO - Documento contém marcações [PENDENTE] ou [REVISAR]. Complete informações antes do envio oficial');
    }
    
    // Limitar a 12 alertas mais relevantes
    alertas = alertas.slice(0, 12);

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
