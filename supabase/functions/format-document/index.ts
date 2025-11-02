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

    const systemPrompt = `SISTEMA (papel): Você é um formatador regulatório. Sua tarefa é transformar um RASCUNHO de relatório, com base no MANIFEST (seções e regras), em:
(1) DOCUMENT_HTML: corpo do relatório já formatado (HTML limpo, com <h1>, <h2>, <table>, <thead>, <tbody>, listas).
(2) STRUCT_DATA_JSON: dados estruturados para validações/telemetria (somatórios, alertas, sugestões).

REGRAS IMPORTANTES:
- NÃO invente números. Use somente os valores do RASCUNHO.
- Números: detectar pt-BR e normalizar (ex.: 1.240.000,00 → 1240000.00) mantendo também a forma pt-BR ("R$ 1.240.000,00").
- Estrutura (seções/tabelas) deve seguir o MANIFEST (\`sections\`, \`tableSpec\`, \`placeholders\`, \`rules\`).
- O HTML deve ser minimalista e sem CSS inline desnecessário: apenas <h1>, <h2>, <p>, <ul>/<ol>, <table>/<thead>/<tbody>/<tr>/<th>/<td>, <strong>, <em>.
- Tabelas: inclua cabeçalho <thead> seguindo as colunas do MANIFEST.
- Onde houver campos vazios no RASCUNHO, deixe vazio (não fabular).
- **VALIDAÇÃO DE COMPLETUDE**: Compare o RASCUNHO com o MANIFEST e identifique TODAS as seções, campos e tabelas que estão faltando ou incompletas. Gere alertas específicos para cada item faltante.
- Saída FINAL deve conter apenas três blocos, nesta ordem e com estes marcadores:
---DOCUMENT_HTML---
[HTML AQUI]
---STRUCT_DATA_JSON---
[JSON AQUI]
---END---

ENTRADAS:
<<RASCUNHO>>
{RASCUNHO}
<</RASCUNHO>>

<<MANIFEST>>
{MANIFEST}
<</MANIFEST>>

CONTEÚDO DO DOCUMENT_HTML (HTML):
- Título principal <h1> com o nome do regime (RA, RDA, PPB ou MOVER).
- Seções em <h2> obedecendo a ordem do MANIFEST (ex.: Identificação, Perfil/Mapa/Resumo, Projetos, Indicadores, Conformidades, Anexos).
- Em cada seção de tabela, construa uma <table> com <thead> (nomes das colunas do MANIFEST) e <tbody> com as linhas extraídas do RASCUNHO.
- Frases curtas, técnicas, sem alterar números.

CONTEÚDO DO STRUCT_DATA_JSON (JSON):
{
  "identificacao": { "empresa":"", "cnpj":"", "anoBase":0, "unidadeFabril":"", "portaria":"" },
  "sections": {
    // chaves = keys do MANIFEST (ex.: "perfil_investimentos", "mapa_etapas", "resumo_disp", "projetos", "indicadores", ...)
    // cada seção tabela = array de objetos com as colunas do MANIFEST; para colunas de moeda/percentual inclua:
    //   <Coluna>Number (número normalizado) e <Coluna>BRL (string pt-BR) ou <Coluna>Percent (número)
  },
  "calculos": {
    "perfilTotalNumber": 0, "perfilTotalBRL":"R$ 0,00",
    "projetosTotalNumber": 0, "projetosTotalBRL":"R$ 0,00"
  },
  "checks": {
    "sumCheck": { "ok": true, "diferencaNumber": 0, "mensagem": "" },
    "percentuaisMinimos": [{ "linha":1, "ok":true, "mensagem":"" }],
    "trlProgress": [{ "codigo":"", "ok":true, "mensagem":"" }],
    "textPresence": [{ "alvo":"Serviços de Terceiros", "presente":false, "mensagem":"" }],
    "requiredColumns": [{ "secao":"", "coluna":"", "linha":1, "ok":true, "mensagem":"" }]
  },
  "alertas": [ "mensagens curtas de conformidade" ],
  "sugestoes": [ "bullets curtos de clareza (sem mudar números)" ]
}

REGRAS DE VALIDAÇÃO (aplicar SOMENTE se existirem no MANIFEST):
- numeric-sum-check: comparar somatórios entre seções; se diferente, checks.sumCheck.ok=false e gerar alerta.
- numeric-compare-row: validar por linha (ex.: % Realizado >= % Mínimo).
- trl-progress: TRL_Alvo >= TRL_Inicial por projeto; caso contrário, alerta.
- text-presence: se "Serviços de Terceiros" aparecer, crie uma entrada textPresence e um alerta pedindo justificativa.
- required-column: se alguma coluna obrigatória estiver vazia, sinalizar em requiredColumns e gerar alerta.
- **completeness-check**: CRÍTICO - Compare cada seção do MANIFEST com o RASCUNHO:
  * Se uma seção obrigatória estiver COMPLETAMENTE ausente, gere alerta: "⚠️ Seção obrigatória '[Nome da Seção]' está faltando no documento"
  * Se uma seção existe mas está VAZIA ou com placeholder, gere alerta: "⚠️ Seção '[Nome da Seção]' está incompleta - preencha com os dados necessários"
  * Se uma tabela obrigatória está faltando ou com dados de exemplo, gere alerta: "⚠️ Tabela '[Nome da Tabela]' precisa ser preenchida com dados reais"
  * Para cada campo obrigatório vazio, gere alerta específico: "⚠️ Campo obrigatório '[Nome do Campo]' na seção '[Seção]' precisa ser preenchido"
  * Liste TODOS os campos faltantes de forma clara e acionável

FORMATO FINAL (OBRIGATÓRIO):
---DOCUMENT_HTML---
[HTML]
---STRUCT_DATA_JSON---
[JSON]
---END---

=== TEMPLATE DE REFERÊNCIA (MANIFEST) ===
${templateContent.substring(0, 4000)}`;

    const userPrompt = `<<RASCUNHO>>
${documentText.substring(0, 10000)}
<</RASCUNHO>>

<<MANIFEST>>
${templateContent}
<</MANIFEST>>

Processe o RASCUNHO conforme as instruções do sistema e retorne no formato especificado:
---DOCUMENT_HTML---
---STRUCT_DATA_JSON---
---END---`;

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
    const aiResponse = aiData.choices[0].message.content;
    
    // Parse da resposta estruturada
    const htmlMatch = aiResponse.match(/---DOCUMENT_HTML---\s*([\s\S]*?)\s*---STRUCT_DATA_JSON---/);
    const jsonMatch = aiResponse.match(/---STRUCT_DATA_JSON---\s*([\s\S]*?)\s*---END---/);
    
    let textoFormatado = '';
    let structData: any = null;
    
    if (htmlMatch && jsonMatch) {
      textoFormatado = htmlMatch[1].trim();
      try {
        structData = JSON.parse(jsonMatch[1].trim());
        console.log('JSON estruturado parseado com sucesso');
      } catch (e) {
        console.error('Erro ao parsear JSON estruturado:', e);
        console.error('JSON que falhou:', jsonMatch[1]);
      }
    } else {
      console.warn('Formato de resposta não reconhecido, usando resposta completa');
      textoFormatado = aiResponse;
    }
    
    if (!textoFormatado) {
      console.warn('HTML vazio após parse, usando resposta completa');
      textoFormatado = aiResponse;
    }

    // Usar dados estruturados se disponíveis, caso contrário fazer análise do HTML
    let sugestoes: string[] = [];
    let alertas: string[] = [];
    
    if (structData) {
      sugestoes = structData.sugestoes || [];
      alertas = structData.alertas || [];
    } else {
      // Fallback: análise do HTML gerado
      const tipoRegime = templateName?.toLowerCase() || '';
      
      if (textoFormatado.includes('<table')) {
        sugestoes.push('✓ Dados organizados em tabelas estruturadas');
      }
      if (textoFormatado.includes('<thead>')) {
        sugestoes.push('✓ Cabeçalhos de tabelas formatados corretamente');
      }
      if (textoFormatado.match(/R\$\s*[\d.,]+/)) {
        sugestoes.push('✓ Valores monetários padronizados no formato brasileiro');
      }
      
      alertas.push('⚠️ Revise o documento formatado antes do envio oficial');
      alertas.push('⚠️ Confirme que todos os valores numéricos estão corretos');
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
